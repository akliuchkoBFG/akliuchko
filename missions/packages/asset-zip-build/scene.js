/* global
	cc
	_Scene
*/

// Extend require to remove cached modules before requiring
// Cocos Creator properly reloads the scene.js file when reloading an editor package, but does not remove modules required by this file
var require = (function(ccRequire) {
	return function(filePath) {
		const cacheSearchString = filePath.replace('./', '');
		// Remove file from require cache
		Object.keys(ccRequire.cache)
		.filter((path) => {
			return path.includes(cacheSearchString);
		})
		.forEach((pathToRemove) => {
			delete ccRequire.cache[pathToRemove];
		});
		return ccRequire(filePath);
	};
})(require);


const AssetUtil = require('./AssetUtil.js');

const Fs = require('fire-fs');
const Path = require('path');
const MAX_FILEIO_CONCURRENCY = 4;

// Cocos Creator build classes
const FileWriter = Editor.require('app://editor/page/build/file-writer');
const AssetBuilder = Editor.require('app://editor/page/build/build-asset');
const AssetCrawler = Editor.require('app://editor/page/build/asset-crawler');

// Use the AssetCrawler to traverse the asset dependency graph
// Builds and copies json resources and some raw assets
function buildAssets(sceneUuid, bundleDir, callback) {
	if (!callback) {
		Editor.error("No callback for building assets in scene.js");
	}
	const temp = Path.join(bundleDir, 'res', 'import');
	Fs.ensureDirSync(temp);
	const prettyJson = true;
	const writer = new FileWriter(temp, prettyJson);
	const builder = new AssetBuilder(writer, Editor.importPath, 'mac');
	// TODO evaluate/add texture packer support
	const crawler = new AssetCrawler(builder, MAX_FILEIO_CONCURRENCY);
	crawler.start([sceneUuid], callback);
}


module.exports = {
	'get-scene-uuid'(event) {
		const scene = _Scene.currentScene();

		if (event.reply) {
			event.reply(null, scene.uuid);
		}
	},
	'get-asset-uuids-from-scene'(event) {
		const scene = _Scene.currentScene();
		const uuidList = AssetUtil.getUuidsFromSceneGraph(scene);
		if (event.reply) {
			Editor.log("Found uuids: " + uuidList.size);
			event.reply(null, Array.from(uuidList));
		}
	},
	'build-assets'(event, sceneUuid, outputDir) {
		buildAssets(sceneUuid, outputDir, event.reply);
	},
};