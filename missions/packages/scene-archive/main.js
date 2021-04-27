'use strict';
const PACKAGE_NAME = 'scene-archive';
const PackageUtil = Editor.require('packages://asset-zip-build/PackageUtil.js');
const SceneArchiveUtil = new PackageUtil(PACKAGE_NAME);
const path = require('path');
const Fs = require('fire-fs');

function exportScene(uuid, dest) {
	const outputDir = path.dirname(dest);
	Fs.ensureDirSync(outputDir);

	return SceneArchiveUtil.callSceneScript('export-scene', uuid, dest);
}

function importScene(url) {
	return SceneArchiveUtil.callSceneScript('import-scene', url);
}

module.exports = {
	load () {
		// execute when package loaded
	},

	unload () {
		// execute when package unloaded
	},

	// register your ipc messages here
	messages: {
		'open' () {
			// open entry panel registered in package.json
			Editor.Panel.open('scene-archive');
		},

		'export-scene' (event, uuid) {
			Editor.log('Starting export for scene' + uuid);
			exportScene(uuid, path.join(Editor.projectInfo.path, 'temp', 'scene-archive', 'export.zip'))
			.then((archivePath) => {
				event.reply(null, archivePath);
			})
			.catch(event.reply);
		},

		'test-export' () {
			Editor.log("Testing scene export on current scene " + Editor.currentSceneUuid);
			exportScene(Editor.currentSceneUuid, path.join(Editor.projectInfo.path, 'temp', 'scene-archive', 'export.zip'));
		},

		// import files...
		'import-archive' (event, url) {
			Editor.log('Importing from ' + url);
			importScene(url);
		}
	},
};