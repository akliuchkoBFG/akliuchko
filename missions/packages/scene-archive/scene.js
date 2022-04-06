/* global
	_Scene
*/
const fs = require("fire-fs");
const Export = Editor.require("packages://package-asset/parse/export.js");
const Import = Editor.require("packages://package-asset/parse/import.js");
const JSZip = Editor.require("packages://package-asset/lib/jszip.min.js");
const path = require('path');
const request = require('request');
const del = require('del');
const Promise = require('bluebird');
const electron = require('electron');
const dialog = electron.remote.dialog;

const ASSET_BASE_DIR = Editor.url('db://assets/');
const UUID_FILE = "file-to-uuid.json";

class InternalImportRequired extends Error {}

// _addImageAsset normally async loads up an thumbnail image that doesn't matter here
// This only changes the normal panel display if it is docked to the same window as the scene
Import._addImageAsset = function _addImageAsset(e, t) {
	const r = path.parse(e.name);
	Import._imgArr[r.name + r.ext] = "unpack://static/icon/assets/sprite-frame.png";
	Import._addAsset(e.name, t);
};

function createZipFromAssets(assetList, destination, callback) {
	const jsZip = new JSZip();
	const assetTypes = {};
	const fileToUUID = {};

	for (let i = 0; i < assetList.length; ++i) {
		const asset = assetList[i];
		if ("directory" !== asset.type) {
			const relativePath = path.relative(ASSET_BASE_DIR, asset.url);
			jsZip.file(relativePath, fs.readFileSync(asset.url));
			fileToUUID[relativePath] = asset.uuid;
			jsZip.file(relativePath + ".meta", fs.readFileSync(asset.url + ".meta"));
			assetTypes[asset.name] = asset.type;
		}
	}

	jsZip.file("&asset&type&.json", JSON.stringify(assetTypes));
	jsZip.file(UUID_FILE, JSON.stringify(fileToUUID));
	jsZip.generateNodeStream({
		type : "nodebuffer"
	})
	.pipe(fs.createWriteStream(destination))
	.on("finish", function() {
		Editor.log(`Finished exporting zip to ${destination}`);
		callback(null, destination);
	});
}

function exportScene(uuid, destination, callback) {
	Editor.Scene.callSceneScript("package-asset", "query-depend-asset", uuid, (e, t) => {
		if (e) {
			Editor.error(e);
			callback(e);
			return;
		}
		Export.queryAssetTreeByUuidList(t, (err, assetInfo) => {
			if (err) {
				Editor.error(err);
				callback(e);
				return;
			}
			// Ignore all assets in the direct publish directory
			const allAssets = assetInfo.allAssets.filter((resInfo) => {
				return resInfo.url && resInfo.url.indexOf('assets/direct_publish') === -1;
			});

			createZipFromAssets(allAssets, destination, callback);
		});
	}, 120e4);
}

function showImportProgressLog(progress) {
	// {"curProgress":18,"total":18,"outStrLog":"Import complete..."}
	Editor.log(progress.outStrLog + " (" + progress.curProgress + "/" + progress.total + ")");
	if (progress.curProgress === progress.total) {
		Editor.log("Please wait for the asset library to refresh (it may take a while)");
	}
}

// Import an archive using the Cocos Creator written package-asset extension classes
// This flow generates new UUIDs for assets being imported and can break asset links in existing scenes/prefabs
function importWithInternalTools(zipPath) {
	return Promise.resolve()
	.then(() => {
		return new Promise((resolve, reject) => {
			Import.analyticalZip(zipPath, (err, assetTree) => {
				if (assetTree) {
					resolve(assetTree);
				} else {
					reject(err);
				}
			});
		});
	}).then((assetTree) => {
		const assetPath = Editor.url('db://assets/');
		Import.importZip(assetPath, assetTree, showImportProgressLog);
	});
}

// Download zip to disk, returns zip contents for ease of extraction
function downloadZip(url, destPath) {
	return (new Promise((resolve, reject) => {
		const zipPath = path.join(destPath, "import.zip");
		let responseBody;
		request.get({
			url,
			encoding: null,
		}, (err, response, body) => {
			if (response.statusCode === 200) {
				responseBody = body;
			} else {
				reject(new Error(`Failed to connect to ${url} Status code: ${response.statusCode}`));
			}
		})
		.pipe(fs.createWriteStream(zipPath))
		.on('error', (err) => {
			reject(err);
		})
		.on('finish', () => {
			resolve([responseBody, zipPath]);
		});
	}));
}

// Backup an asset after detecting a UUID collision
function backupAsset(assetInfo, backupDir, newAssetPath) {
	const assetRelativePath = path.relative(ASSET_BASE_DIR, assetInfo.path);
	const backupPath = path.join(backupDir, assetRelativePath);
	Editor.warn([
		`[Scene Import] UUID collision detected, auto resolving (expand for details)`,
		`New imported asset: ${newAssetPath}`,
		`Existing asset: ${assetRelativePath}`,
		`Backing up existing asset to: ${backupPath}`,
	].join('\n'));
	return new Promise((resolve, reject) => {
		fs.ensureDirSync(path.dirname(backupPath));
		fs.copy(assetInfo.path, backupPath, (err) => {
			if (err) {
				return reject(new Error("Unable to backup existing asset"));
			}
			// Also backup the meta file if it exists
			fs.copy(assetInfo.path + ".meta", backupPath + ".meta", () => {
				// Delete asset from assetdb
				Editor.remote.assetdb.delete([assetInfo.url], resolve);
			});
		});
	});
}

// Copy file from extracted archive to the assets folder
function copyFileToAssets(relativePath, sourceDir, backupDir, fileToUUID) {
	const filePath = path.join(sourceDir, relativePath);
	const destPath = path.join(Editor.url('db://assets/'), relativePath);
	return new Promise((resolve, reject) => {
		// Open asset source file
		fs.readFile(filePath, (err, sourceFile) => {
			if (fs.existsSync(destPath)) {
				// File already exists in the project, check for a diff
				fs.readFile(destPath, (err, existingFile) => {
					if (sourceFile.equals(existingFile)) {
						// File being imported is identical to existing file in project
						resolve();
					} else {
						// File being imported differs from existing asset, backup existing asset before importing
						const backupPath = path.join(backupDir, relativePath);
						fs.ensureDirSync(path.dirname(backupPath));
						fs.writeFile(backupPath, existingFile, (err) => {
							if (err) {
								err.userMessage = "Scene import failed, unable to backup existing asset: " + destPath;
								return reject(err);
							}
							// Overwrite existing file
							fs.writeFile(destPath, sourceFile, (err) => {
								if (err) {
									err.userMessage = "Scene import failed, unable to extract asset: " + destPath;
									return reject(err);
								}
								resolve();
							});
						});
					}
				});
			} else {
				let backupPromise = Promise.resolve();
				// Asset does not exist in the same directory, check for UUID collision
				const existingAssetInfo = Editor.remote.assetdb.assetInfoByUuid(fileToUUID[relativePath]);
				if (existingAssetInfo) {
					// Asset with this UUID already in the project, migrate asset and meta file to backup directories
					backupPromise = backupAsset(existingAssetInfo, backupDir, relativePath);
				}
				backupPromise.then(() => {
					fs.ensureDirSync(path.dirname(destPath));
					fs.writeFile(destPath, sourceFile, (err) => {
						if (err) {
							err.userMessage = "Scene import failed, unable to extract asset: " + destPath;
							return reject(err);
						}
						resolve();
					});
				})
				.catch(reject);
			}
		});
	});
}

// Import scene archive from zip URL
function downloadAndImportArchive(url) {
	const tempDir = path.join(Editor.projectInfo.path, 'temp', 'scene-archive');
	const extractDir = path.join(tempDir, 'import');
	const backupDir = path.join(tempDir, 'backup');
	fs.ensureDirSync(extractDir);
	fs.ensureDirSync(backupDir);
	Promise.resolve()
	.then(() => {
		// Require existing scene to be saved before starting the flow
		return new Promise((resolve, reject) => {
			dialog.showMessageBox({
				type: 'warning',
				message: "Scene must be saved before starting a scene import!",
				buttons: ['Save', 'Cancel'],
			}, (buttonIndex) => {
				if (buttonIndex === 0) {
					_Scene.save(() => {
						resolve();
					});
				} else {
					reject(new Error('Save or discard changes to scene before importing a new scene'));
				}
			});
		});
	})
	.then(() => {
		// Delete existing import directory to avoid importing contents from an old zip again
		return new Promise((resolve) => {
			del(['**/*'], {
				cwd: extractDir,
			}, resolve);
		});
	})
	.then(() => {
		// Delete existing backup directory
		return new Promise((resolve) => {
			del(['**/*'], {
				cwd: backupDir,
			}, resolve);
		});
	})
	.then(() => {
		return downloadZip(url, tempDir);
	})
	.then(([zipContents, zipPath]) => {
		return JSZip.loadAsync(zipContents)
		.then((zip) => {
			if (Object.keys(zip.files).indexOf(UUID_FILE) !== -1) {
				// Safe to run the new import flow
				return zip;
			} else {
				// Run old import flow
				const err = new InternalImportRequired();
				err.zipPath = zipPath;
				throw err;
			}
		});
	})
	.then((zip) => {
		// Extract zip to temp directory
		const filePaths = Object.keys(zip.files)
		.filter((filePath) => {
			// Skip directories, these will only be created if there are files inside
			const isDir = zip.files[filePath].dir;
			// Skip extracting the asset type map, manual import will not need this
			const isTypeMap = filePath === '&asset&type&.json';
			return !isDir && !isTypeMap;
		});
		return Promise.map(filePaths, (filePath) => {
			return new Promise((resolve, reject) => {
				const outPath = path.join(extractDir, filePath);
				fs.ensureDirSync(path.dirname(outPath));
				zip.file(filePath)
				.nodeStream()
				.pipe(fs.createWriteStream(outPath))
				.on('finish', () => {
					resolve();
				})
				.on('error', reject);
			});
		})
		.then(() => {
			// Get the UUID map
			return zip.file(UUID_FILE).async('string');
		})
		.then((uuidJSON) => {
			const fileToUUID = JSON.parse(uuidJSON);
			return [filePaths, fileToUUID];
		});
	})
	.then(([filePaths, fileToUUID]) => {
		// Move files from the import directory to the project
		// Skip files that have not changed, backup files that are being overwritten
		return Promise.map(filePaths, (relativePath) => {
			if (relativePath === UUID_FILE) {
				// Skip copying a supporting file to assets
				return;
			}
			return copyFileToAssets(relativePath, extractDir, backupDir, fileToUUID);
		})
		.then(() => {
			return fileToUUID;
		});
	})
	.then((fileToUUID) => {
		return new Promise((resolve) => {
			const assetURL = 'db://assets/';
			Editor.log("Refreshing assetdb. This could take a moment.");
			// Refresh using remote call otherwise this is almost always a guaranteed IPC timeout
			Editor.remote.assetdb.refresh(assetURL, () => {
				// Try to load the imported scene file
				// If unavailable, reload the existing scene to avoid missing assets from UUID collision
				const scenes = Object.keys(fileToUUID).filter((relativePath) => {
					return relativePath.indexOf('.fire') !== -1;
				});
				const sceneToLoad = fileToUUID[scenes[0]] || Editor.remote.currentSceneUuid;
				_Scene.loadSceneByUuid(sceneToLoad, () => {
					_Scene.updateTitle(_Scene.currentScene().name);
					resolve();
				});
			});
		});
	})
	.then(() => {
		Editor.success("Scene import complete!");
	})
	.catch(InternalImportRequired, (err) => {
		const zipPath = err.zipPath;
		// Internal import skips the success message because internal import doesn't have a complete callback
		return importWithInternalTools(zipPath);
	})
	.catch((err) => {
		Editor.failed(err.userMessage || err);
	});
}

module.exports = {
	'export-scene'(event, uuid, dest) {
		exportScene(uuid, dest, event.reply);
	},

	'import-scene'(event, url) {
		downloadAndImportArchive(url);
		if (event.reply) {
			event.reply(null);
		}
	},
};