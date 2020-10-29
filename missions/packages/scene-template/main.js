'use strict';

const PACKAGE_NAME = 'scene-template';

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


module.exports = {
	load () {
	// execute when package loaded
	},

	unload () {
	// execute when package unloaded
	},

	// register your ipc messages here
	messages: {
		'create-scene' () {
			// open entry panel registered in package.json
			Editor.Panel.open(PACKAGE_NAME);
		},
		'clicked' (event, value) {
			callSceneScript('copy-scene', value);
		}
	},
};