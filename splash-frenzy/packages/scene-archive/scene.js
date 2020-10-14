const Electron = require("electron");
const Fs = require("fire-fs");
const Export = Editor.require("packages://package-asset/parse/export.js");
const Import = Editor.require("packages://package-asset/parse/import.js");
const JSZip = Editor.require("packages://package-asset/lib/jszip.min.js");
const Path = require('path');
const Request = require('request');

// _addImageAsset normally async loads up an thumbnail image that doesn't matter here
// This only changes the normal panel display if it is docked to the same window as the scene
Import._addImageAsset = function _addImageAsset(e, t) {
	const r = Path.parse(e.name);
	Import._imgArr[r.name + r.ext] = "unpack://static/icon/assets/sprite-frame.png";
	Import._addAsset(e.name, t);
};

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

			exportAssets(allAssets, destination, callback);
		});
	}, 3e4);
}

function exportAssets(assetList, destination, callback) {
	const jsZip = new JSZip();
	const processedDirectories = {};
	const assetTypes = {};
	function processDir(asset) {
		if ("Assets" === asset.parent.name) {
			const zip = jsZip.folder(asset.name);
			jsZip.file(asset.name + ".meta", Fs.readFileSync(asset.url + ".meta"));
			processedDirectories[asset.name] = zip;
			return zip;
		} else {
			let zip = processedDirectories[asset.parent.name];
			if (!zip) {
				zip = processDir(asset.parent);
				zip.file(asset.name + ".meta", Fs.readFileSync(asset.url + ".meta"));
			}
			processedDirectories[asset.name] = zip.folder(asset.name);
			return processedDirectories[asset.name];
		}
	}
	function processAsset(self) {
		if ("Assets" === self.parent.name) {
			jsZip.file(self.name, Fs.readFileSync(self.url));
			jsZip.file(self.name + ".meta", Fs.readFileSync(self.url + ".meta"));
		} else {
			let res = processedDirectories[self.parent.name];
			if (!res) {
				res = processDir(self.parent);
			}
			res.file(self.name, Fs.readFileSync(self.url));
			res.file(self.name + ".meta", Fs.readFileSync(self.url + ".meta"));
		}
	}

	for (let i = 0; i < assetList.length; ++i) {
		const asset = assetList[i];
		if ("directory" === asset.type) {
			processDir(asset);
		} else {
			processAsset(asset);
			assetTypes[asset.name] = asset.type;
		}
	}
	jsZip.file("&asset&type&.json", JSON.stringify(assetTypes));
	jsZip.generateNodeStream({
		type : "nodebuffer"
	}).pipe(Fs.createWriteStream(destination)).on("finish", function() {
		Editor.log(`Finished exporting zip to ${destination}`);
		callback(null, destination);
	});
}


function showImportProgressLog(progress) {
	// {"curProgress":18,"total":18,"outStrLog":"Import complete..."}
	Editor.log(progress.outStrLog + " (" + progress.curProgress + "/" + progress.total + ")");
	if (progress.curProgress === progress.total) {
		Editor.log("Please wait for the asset library to refresh (it may take a while)");
	}
}

// import archive from a remote location
function downloadAndImportArchive(url) {
	// download the archive

	return new Promise((resolve, reject) => {
		const tempDir = Path.join(Editor.projectInfo.path, 'temp', 'scene-archive');
		Fs.ensureDirSync(tempDir);
		const zipPath = Path.join(tempDir, "import.zip");

		const fws = Fs.createWriteStream(zipPath);
		const req = Request.get(url).pipe(fws);
		req.on('error', (err) => {
			reject(err);
		});
		req.on('finish', () => {
			Editor.log("archive downloaded...");
			resolve(zipPath);
		});
	}).then((zipPath) => {
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
	}).catch((e) => {
		Editor.error(e);
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