// Changing this string will cause the hash of all zips created using an AssetManifest
// This effectively invalidates all previously downloaded Cocos Creator asset zips
const MasterBundleHash = '2021_04_26';

const Globby = require('globby');
const Fs = require('fire-fs');
const Path = require('path');
const Async = require('async');
const MAX_FILEIO_CONCURRENCY = 4;
const crypto = require('crypto');
const _ = require('lodash');

function generateHash(data) {
	return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
}

function stringifyAssets(assets) {
	// sort our asset names to ensure a scene with the same assets/hashes will always have the same value
	const assetArray = [];
	_.forEach(assets, (value, key) => {
		assetArray.push(key + value);
	});
	assetArray.sort();

	const stringifiedAssets = JSON.stringify(assetArray);
	Editor.log(stringifiedAssets);
	return stringifiedAssets;
}

class AssetZip {
	constructor(bundleName, sourceDirectory) {
		this.bundleName = bundleName;
		this.sourceDirectory = sourceDirectory;
		this._assets = {};
	}

	build() {
		return new Promise((resolve, reject) => {
			this._build((err, manifest) => {
				if (err) return reject(err);
				resolve(manifest);
			})
		});
	}

	_build(callback) {
		Async.waterfall([
			(cb) => {
				// Include all files except dotfiles underneath sourceDirectory
				let promise = Globby(['**/*'], {
					cwd: this.sourceDirectory,
					nodir: true,
				}, cb);
				// some environs return a promise instead of invoking the cb
				if (promise) {
					promise.then((paths) => {
						cb(null, paths);
					});
				}
			},
			(paths, cb) => {
				// Read files from source directory
				Async.eachLimit(paths, MAX_FILEIO_CONCURRENCY, (path, cb) => {
					Fs.readFile(Path.join(this.sourceDirectory, path), (err, fileData) => {
						if (path.endsWith(".json") && Fs.existsSync(Path.join(this.sourceDirectory, path.replace(".json", ""), "raw-skeleton.json"))) {
							var json = JSON.parse(fileData);
							if (json._skeletonJson) {
								delete json._skeletonJson;
								fileData = JSON.stringify(json);
								Fs.writeFileSync(Path.join(this.sourceDirectory, path), fileData);
							}
						}
						// Create manifest entry and add to zip
						this._addToManifest(path, fileData);
						this._writeToZip(path, fileData, cb);
					});
				}, cb);
			},
			(cb) => {
				// Generate asset zip hash from asset list
				this._assets['MasterBundleHash'] = MasterBundleHash;
				const assetString = stringifyAssets(this._assets);
				const zipHash = generateHash(assetString);
				delete this._assets['MasterBundleHash'];
				// Write manifest file to source directory
				const manifest = {
					assets: this._assets,
					bundle: zipHash,
					fileName: this.bundleName + '.zip',
				};
				const manifestName = this.bundleName + '.manifest';
				Fs.writeFile(Path.join(this.sourceDirectory, manifestName), JSON.stringify(manifest), (err) => {
					if (err) return cb(err);
					cb(null, manifest);
				});
			}
		], callback);
	}

	_addToManifest(localPath, fileData) {
		const fileHash = generateHash(fileData);
		this._assets[localPath] = fileHash;
	}

	_writeToZip(localPath, fileData, callback) {
		// TODO: The zip writing step could be pulled into here for added efficiency
		// Since the zip needs to read the contents of each file to build the manifest
		//  refactoring the zip building step here would cut down on file reads
		callback();
	}
}

module.exports = AssetZip;