'use strict';

const LegacySync = require('./LegacySync.js');
// Use bluebird promises for catch filters
const Promise = require('bluebird');

const request = require('request');
const fs = require('fire-fs');
const path = require('path');
const async = require('async');
const _ = require('lodash');
const crypto = require('crypto');
const exec = require('child_process').exec;
const JSZip = require('./lib/jszip.min.js');
const PackageUtil = Editor.require('packages://asset-zip-build/PackageUtil.js');
const TEMP_DIR = path.join(Editor.projectInfo.path, 'temp', 'sag', 'self-aware-sync');
const VERSION_MANIFEST_PATH = Editor.url('profile://local/shared-asset-versions.json');
const PigbeeRequest = Editor.require('packages://pigbee-utils/PigbeeRequest.js');

// Loaded from secrets.json
let secrets = {};

class InvalidProjectError extends Error {}

function moveDirContents(dir, destDir) {
	return new Promise((resolve, reject) => {
		const files = fs.readdirSync(dir);
		async.each(files, (file, cb) => {
			const sourcePath = path.join(dir, file);
			const destPath = path.join(destDir, file);
			fs.move(sourcePath, destPath, cb);
		}, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

function checkSourceControl() {
	// Source control gets shared asset updates through code pulls/branch merges
	// If the project is checked in to the repository, early out of using this package for updates
	return new Promise((resolve, reject) => {
		exec(
			'hg identify -r .',
			{
				cwd: Editor.projectInfo.path,
			},
			(err /* , stdout, stderr*/) => {
				if (err) {
					return resolve();
				} else {
					reject(new InvalidProjectError("Cannot sync shared assets from a project in the casino repository"));
				}
			}
		);
	});
}

function closePackageWatcher() {
	// Stop the packages file watcher to avoid file I/O errors mid-update
	const closeWatcher = Promise.resolve()
	.then(() => {
		// This action is async in newer versions of chokidar
		return Editor.watcher && Editor.watcher.close();
	});
	return closeWatcher;
}

function restartPackageWatcher() {
	if (Editor.watcher && Editor.watcher.closed) {
		// Restart the package watcher
		return new Promise((resolve) => {
			Editor.watchPackages(resolve);
		});
	}
	return Promise.resolve();
}

function loadSecrets() {
	const readFileAsync = Promise.promisify(fs.readFile);
	return readFileAsync(Editor.url("packages://self-aware-sync/secrets.json"))
	.then((data) => {
		secrets = JSON.parse(data);
	});
}

function getRemoteSharedAssetVersions() {
	return PigbeeRequest.get({
		env: 'dev',
		app: 'bfc',
		controller: 'cocos_creator',
		action: 'getSharedAssetVersions',
	})
	.then((response) => {
		const versions = JSON.parse(response).versions;
		return versions;
	});
}

function getLocalSharedAssetVersions() {
	const readFileAsync = Promise.promisify(fs.readFile);
	return readFileAsync(VERSION_MANIFEST_PATH)
	.then((contents) => {
		return JSON.parse(contents);
	})
	.catch(() => {
		return {};
	});
}

function filterForNewVersions(remoteVersions) {
	return getLocalSharedAssetVersions()
	.then((localVersions) => {
		const updateRequired = [];
		_.forOwn(remoteVersions, ({version, cloudURL, pathInProject, encryption}, bundleName) => {
			if (!localVersions[bundleName] || localVersions[bundleName].version !== version) {
				updateRequired.push({
					bundleName,
					version,
					cloudURL,
					pathInProject,
					encryption
				});
			}
		});
		return {
			updateRequired,
			remoteVersions,
		};
	});
}

function updateSharedAssetZip({bundleName, cloudURL, pathInProject, encryption}) {
	const fullPathInProject = path.join(Editor.projectInfo.path, pathInProject);
	const bundleDir = path.join(TEMP_DIR, bundleName);
	fs.removeSync(bundleDir);
	fs.mkdirSync(bundleDir);
	// Temporary destination for extracting the archive
	const extractDir = path.join(bundleDir, 'extracted');
	fs.mkdirSync(extractDir);
	// Temporary backup of previous destination directory's contents
	const backupDir = path.join(bundleDir, 'backup');
	fs.mkdirSync(backupDir);
	fs.ensureDirSync(extractDir);
	// Fetch Zip from cloud
	const getAsync = Promise.promisify(request.get);
	return getAsync({
		url: cloudURL,
		encoding: null,
	})
	.then(([response, body]) => {
		if (response.statusCode !== 200) {
			throw new Error(`Failed to download zip\nURL: ${cloudURL}\nstatusCode: ${response.statusCode}`);
		}
		return body;
	})
	.then((responseBody) => {
		if (_.isEmpty(encryption)) {
			return responseBody;
		}
		const encryptionInfo = secrets.versions[encryption.version];
		const key = Buffer.from(encryptionInfo.key, 'hex');
		const iv = Buffer.from(encryption.iv, 'hex');
		const decipher = crypto.createDecipheriv(
			encryptionInfo.algorithm,
			key,
			iv
		);
		return Buffer.concat([decipher.update(responseBody), decipher.final()]);
	})
	.then((zipContents) => {
		return JSZip.loadAsync(zipContents);
	})
	.then((zip) => {
		// Extract zip to temp directory
		const filePaths = Object.keys(zip.files);
		return Promise.map(filePaths, (filePath) => {
			return new Promise((resolve) => {
				const outPath = path.join(extractDir, filePath);
				fs.ensureDirSync(path.dirname(outPath));
				zip.file(filePath)
				.nodeStream()
				.pipe(fs.createWriteStream(outPath))
				.on('finish', () => {
					resolve();
				});
			});
		});
	})
	.then(() => {
		if (pathInProject.startsWith('packages') && fs.existsSync(fullPathInProject)) {
			// Unload existing version of this package
			return new Promise((resolve) => {
				Editor.Package.unload(fullPathInProject, resolve);
			});
		}
	})
	.then(() => {
		return moveDirContents(fullPathInProject, backupDir)
		.catch(() => {
			// No-op if there's nothing to backup
		});
	})
	.then(() => {
		return moveDirContents(extractDir, fullPathInProject);
	})
	.then(() => {
		if (pathInProject.startsWith('packages')) {
			// Load the new version of the package
			return new Promise((resolve, reject) => {
				Editor.Package.load(fullPathInProject, (err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			});
		} else if (pathInProject.startsWith('assets')) {
			// Refresh the asset db to pick up changes since the asset filewatcher only runs
			//  while Cocos Creator is backgrounded
			return new Promise((resolve) => {
				const assetURL = 'db://' + pathInProject;
				Editor.log("Refreshing assetdb: " + assetURL);
				Editor.assetdb.refresh(assetURL, resolve);
			});
		} else {
			Editor.warn("Unknown shared asset type for folder: " + pathInProject);
		}
	});
}

function runSharedAssetZipSync({remoteVersions, updateRequired}) {
	// Already up to date
	if (updateRequired.length === 0) {
		return Promise.resolve();
	}
	fs.ensureDirSync(TEMP_DIR);
	Editor.log(`Updating ${updateRequired.length} shared asset packages`);
	return Promise.each(updateRequired, updateSharedAssetZip)
	.then(() => {
		const writeFileAsync = Promise.promisify(fs.writeFile);
		return writeFileAsync(VERSION_MANIFEST_PATH, JSON.stringify(remoteVersions, null, '\t'));
	});
}

module.exports = {
	messages: {
		'download-shared' (event) {
			Editor.success("=== Starting Self-Aware-Sync ===");
			Promise.resolve()
			.then(checkSourceControl)
			.then(closePackageWatcher)
			.then(loadSecrets)
			.then(getRemoteSharedAssetVersions)
			.then(filterForNewVersions)
			.then(runSharedAssetZipSync)
			// Use legacy sync when the current preview environment doesn't know about SharedAssetZips
			.catch(LegacySync.LegacySyncRequired, () => {
				Editor.log("Running legacy sync from default");
				return LegacySync.unzip_direct_publish()
				.then(LegacySync.unzip_shared_packages);
			})
			.catch(InvalidProjectError, (err) => {
				Editor.log("Skipping update to shared packages\n" + err);
			})
			.then(() => {
				Editor.success("=== Self-Aware-Sync complete! ===");
				if (event.reply) {
					event.reply();
				}
			})
			.catch((err) => {
				Editor.error("=== Self-Aware-Sync failed! ===\n" + err);
				Editor.log(err.stack);
				if (event.reply) {
					event.reply(err);
				}
			})
			.finally(() => {
				restartPackageWatcher();
			});
		},
		'check-for-updates' (event) {
			if (!event.reply) {
				return Editor.error("Unable to provide update info, response callback not present");
			}
			Promise.resolve()
			.then(checkSourceControl)
			.then(getRemoteSharedAssetVersions)
			.then(filterForNewVersions)
			.then(({updateRequired}) => {
				event.reply(null, updateRequired);
			})
			.catch(InvalidProjectError, (/* err */) => {
				// Updates to shared assets are automatically applied through source control
				event.reply(null, []);
			})
			.catch((err) => {
				event.reply(err);
			});
		},
		'get-local-versions' (event) {
			if (!event.reply) {
				return Editor.error("Unable to provide local versions, response callback not present");
			}
			Promise.resolve()
			.then(checkSourceControl)
			.then(getLocalSharedAssetVersions)
			.catch(InvalidProjectError, (/* err */) => {
				// Local versions are provided by the shared asset build package for projects in source control
				const SharedAssetBuildUtil = new PackageUtil('shared-asset-build');
				return SharedAssetBuildUtil.sendToPackage('get-local-versions');
			})
			.then((versions) => {
				event.reply(null, versions);
			})
			.catch((err) => {
				event.reply(err);
			});
		},
	},
};
