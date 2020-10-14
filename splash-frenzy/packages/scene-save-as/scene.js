/* global
	cc
	_Scene
*/
const Fs = require('fs');
function createSceneFromTemplate() {
	return new Promise((resolve /* , reject*/) => {
		const uuid = _Scene.currentScene().uuid;
		Editor.assetdb.queryPathByUuid(uuid, (err, path) => {
			const contents = Fs.readFileSync(path, 'utf-8');
			Editor.assetdb.create ('db://assets/newScene.fire', contents, (err, results) => {
				if (results && results[0]) {
					_Scene.loadSceneByUuid(results[0].uuid, (err) => {
						_Scene.updateTitle(_Scene.currentScene().name);
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
};