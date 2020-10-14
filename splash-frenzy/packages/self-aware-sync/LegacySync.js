// Module for running the legacy version of shared asset sync
// Pulls two tarballs off default/qa environment for packages and assets/direct_publish and extracts locally
// Can be removed after it is reasonable to expect that SharedAssetZips are available on any environment used
//  by anyone else using the direct publish Cocos Creator project (Default/Tools/Treasures/Missions)

const Promise = require('bluebird');
const https = require('https');
const fs = require('fire-fs');
const path = require('path');
const async = require('async');
const exec = require('child_process').exec;
const TEMP_FOLDER = Editor.url("profile://local/self-aware-sync-tmp/");

const BuildSettings = require(Editor.url('packages://asset-zip-build/BuildSettings.js'));

function reloadAllPackages(packagesDir) {
	Editor.log("Reloading all packages");
	const files = fs.readdirSync(packagesDir);
	return new Promise((resolve, reject) => {
		async.each(files, (file, cb) => {
			const packagePath = path.join(packagesDir, file);
			if (fs.lstatSync(packagePath).isDirectory()) {
				Editor.Package.reload(packagePath, cb);
			}
		}, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

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

function unzip_remote_file(source, dest){
	Editor.log("Unzipping from " + source + " to " + dest);

	fs.removeSync(TEMP_FOLDER);
	fs.mkdirSync(TEMP_FOLDER);
	// Temporary destination for extracting the archive
	const extractDir = path.join(TEMP_FOLDER, 'extracted');
	fs.mkdirSync(extractDir);
	// Temporary backup of previous destination directory's contents
	const backupDir = path.join(TEMP_FOLDER, 'backup');
	fs.mkdirSync(backupDir);

	return Promise.resolve()
	.then(() => {
		// Backup existing directory
		return moveDirContents(dest, backupDir);
	})
	.then(() => {
		// Download and extract archive
		return new Promise((resolve, reject) => {
			https.get(source, (response) => {
				const writePath = path.join(TEMP_FOLDER, "manual_zip.tar.gz");
				const writeStream = fs.createWriteStream(writePath);

				response.pipe(writeStream).on('finish', () => {
					exec('tar -xvf "' + writePath + '" -C "' + extractDir + '"', (error, stdout, stderr) => {
						if (error) {
							return reject(error);
						}
						Editor.info("Extracted files...:\n" + stdout + "\n" + stderr);
						resolve();
					});
				});
			});
		});
	})
	.catch((err) => {
		// Failed updating from archive, restore from backup
		return moveDirContents(backupDir, dest)
		.then(() => {
			// Rethrow error
			return Promise.reject(err);
		});
	})
	.then(() => {
		// Move extracted archive to destination
		return moveDirContents(extractDir, dest);
	});
}

function unzip_direct_publish() {
	const curSettings = BuildSettings.getSettings();
	const sourceURL = curSettings.syncURL + "/direct_publish_shared.tar";
	const destPath = Editor.url("db://assets/direct_publish");
	return unzip_remote_file(sourceURL, destPath)
	.then(() => {
		return new Promise((resolve) => {
			Editor.log("Refreshing assetDB... this might take a minute");
			Editor.assetdb.refresh('db://assets/direct_publish/', resolve);
		});
	});
}

function unzip_shared_packages() {
	const curSettings = BuildSettings.getSettings();
	const packagesDir = Editor.url('packages://self-aware-sync/../');
	return Promise.resolve()
	.then(() => {
		const sourceURL = curSettings.syncURL + "/packages_shared.tar";
		return unzip_remote_file(sourceURL, packagesDir);
	})
	.then(() => {
		return reloadAllPackages(packagesDir);
	});
}

class LegacySyncRequired extends Error {}

module.exports = {
	unzip_direct_publish,
	unzip_shared_packages,
	LegacySyncRequired,
};
