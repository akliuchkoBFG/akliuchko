/* global
	cc
	_Scene
*/
const fs = require('fs');
const _ = require('lodash');

const saveScene = _.debounce(() => {
	_Scene.save(() => {});
}, 500);

function createSceneFromTemplate() {
	return new Promise((resolve /* , reject*/) => {
		const uuid = _Scene.currentScene().uuid;
		Editor.assetdb.queryPathByUuid(uuid, (err, path) => {
			const contents = fs.readFileSync(path, 'utf-8');
			Editor.assetdb.create ('db://assets/newScene.fire', contents, (err, results) => {
				if (results && results[0]) {
					_Scene.loadSceneByUuid(results[0].uuid, (err) => {
						_Scene.updateTitle(_Scene.currentScene().name);
						Editor.Ipc.sendToMainWin('scene-save-as:scene-copied');
					});
				}
			});
		});
	});
}


module.exports = {
	'copy-scene': function(event, uuid) {
		createSceneFromTemplate().then((/* scene */) => {
			Editor.log("Scene created from template");
			if (event.reply) {
				event.reply(null, "success");
			}
		}).catch(Editor.error);
	},
	'save-scene'() {
		// After a scene has been copied components are permitted a chance to modify the state of the scene
		//  e.g. a ReskinElement marks itself as not reskinned after copying a scene
		saveScene();
	},
};