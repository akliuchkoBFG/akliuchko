'use strict';

const PACKAGE_NAME = 'scene-save-as';

const fs = require('fire-fs');
const path = require('path');

function callSceneScript(message, ...args) {
	return new Promise((resolve, reject) => {
		Editor.Scene.callSceneScript(PACKAGE_NAME, message, ...args, (err, result) => {
			if (err) {
				if (!(err instanceof Error)) {
					const errData = err;
					err = new Error('PackageUtil.callSceneScript error');
					err.data = errData;
				}
				reject(err);
			}
			resolve(result);
		});
	});
}

// TODO: move to requiring packages://package-utils/moduleShim.js when it is safe to roll that shared package dependency forward
function moduleShim(module, fnName, fn) {
	const ORIG_PREFIX = '__orig__';
	const origFnName = ORIG_PREFIX + fnName;
	// Save off the original function that is being shimmed over
	// Only do this the first time a module is shimmed to avoid recursively adding layers of shims
	if (!module[origFnName]) {
		module[origFnName] = module[fnName];
	}
	// Apply the desired shimmed implmentation, with the original function as the first argument
	module[fnName] = fn.bind(module, module[origFnName].bind(module));
}

function duplicateAsset(uuid) {
	const assetInfo = Editor.assetdb.assetInfoByUuid(uuid);
	if (!assetInfo) {
		Editor.error("Unexpected error duplicating asset, try reloading Cocos Creator: " + uuid);
		return;
	}
	if (assetInfo.isSubAsset) {
		// Duplicating a sub asset by itself doesn't make sense because it's only an entry in a meta file
		Editor.error("Unable to duplicate sub-asset");
	} else if (Editor.assetdb.containsSubAssetsByUuid(uuid)) {
		// Unsupported edge case, but if there was a reason to revisit this, it would be possible to support this
		// To my knowledge there's not much reason to want to copy any of the asset types that include sub assets (just textures?)
		Editor.warn([
			"Unable to duplicate asset with sub-assets, ask for help in #sag-cocos-creator",
			JSON.stringify(assetInfo, null, '\t'),
		].join('\n'));
		return;
	}
	switch(assetInfo.type) {
		// Opt in for supported assets, there are probably some edge cases that make blanket duplication support
		// non-trivial (e.g. spine assets are multiple files with file name references in the atlas text)
		case 'prefab':
		case 'animation-clip':
			const contents = fs.readFileSync(assetInfo.path);
			// Create a copy at the same URL, Creator sees the existing asset and auto-appends numbers to the new filename
			Editor.assetdb.create(assetInfo.url, contents, (err, results) => {
				if (err) {
					Editor.error("Failed to copy asset\n" + err);
					return;
				}
				const copyInfo = results && results[0];
				if (copyInfo) {
					Editor.success("Copied asset to " + path.basename(copyInfo.path));
				}
			});
			break;
		default:
			Editor.warn([
				"Unsupported asset type for duplication, if this would improve your workflow, ask for help in #sag-cocos-creator",
				JSON.stringify(assetInfo, null, '\t'),
			].join('\n'));
			break;
	}
}

function contextDuplicate() {
	const selectedAssets = Editor.Selection.contexts("asset");
	if (selectedAssets.length > 0) {
		selectedAssets.forEach((uuid) => {
			duplicateAsset(uuid);
		});
	}
}

try {
	const AssetMenu = Editor.require('app://editor/builtin/assets/core/menu');
	moduleShim(
		AssetMenu,
		'getContextTemplate',
		function (orig, assetType, allowAssign, lastUuid) {
			const r = orig(assetType, allowAssign, lastUuid);
			const renameLabel = Editor.T("ASSETS.rename");
			const renameIndex = r.findIndex((menuOption) => {
				return menuOption && menuOption.label === renameLabel;
			});
			// Insert context menu item after the rename option in the asset menu
			r.splice(renameIndex + 1, 0, {
				label: "Duplicate",
				click: contextDuplicate,
			});
			return r;
		}
	);
} catch (e) {
	Editor.error("Failed to modify context menu to add 'Duplicate':\n" + e);
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
		'copy-scene' () {
			callSceneScript('copy-scene');
		}
	},
};