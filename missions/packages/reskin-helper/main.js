'use strict';

const PACKAGE_NAME = 'reskin-helper';
const {shell:{openExternal}} = require('electron');

module.exports = {
	load () {
	},

	unload () {
	},

	messages: {
		'add-node-tree-filter' () {
			Editor.Scene.callSceneScript(PACKAGE_NAME, 'add-node-tree-filter');
		},
		'list-pending-reskins'() {
			Editor.Scene.callSceneScript(PACKAGE_NAME, 'get-pending-reskins', (err, needsReskin) => {
				const reskinNodes = needsReskin.map((el) => el.nodePath);
				if (reskinNodes.length > 0) {
					Editor.warn("Nodes that still need to be reskinned:\n" + reskinNodes.join('\n'));
				} else {
					Editor.success("All nodes have been reskinned since copying this scene!");
				}
			});
		},
		'open-help-wiki'() {
			const wikiURL = "https://bigfishgames.atlassian.net/wiki/spaces/SAG/pages/810910082/Tech+Art+Mission+Events+Reskin+Component";
			openExternal(wikiURL);
		},
	},
};
