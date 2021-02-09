/* global
	_Scene
*/

module.exports = {
	'add-node-tree-filter': function(event) {
		const nodeTreeSearch = document.getElementById('search');
		nodeTreeSearch.value = 't:ReskinElement';
	},
	'get-pending-reskins': function(event) {
		const scene = _Scene.currentScene();
		const reskinElements = scene.getComponentsInChildren('ReskinElement')
		.map((reskin) => {
			const isReskinned = reskin.isReskinned;
			const nodePath = _Scene.NodeUtils.getNodePath(reskin.node);
			return {
				isReskinned,
				nodePath,
			};
		});
		if (event && event.reply) {
			event.reply(null, reskinElements.filter((el) => !el.isReskinned));
		}
	},
};
