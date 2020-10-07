var Path = require('path');

// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
	// css style for panel
	style: `
	:host { margin: 5px; }
	h2 { color: #f90; }
	`,

	// html template for panel
	template: `
	<h2>Create Scene From Template</h2>
	<hr />
	<ui-select id="fileSelect"></ui-select>
	<hr />
	<ui-button id="createBtn">Create Scene</ui-button>
	<ui-button id="refreshBtn">Refresh</ui-button>
	<hr />
	<div> To create your own templates, simply save a scene with "template" in the name, or place a scene in a folder with "template" in the name. </div>
	`,

	// element and variable binding
	$: {
	createBtn: '#createBtn',
	refreshBtn: '#refreshBtn',
	fileSelect: '#fileSelect',
	},

	refreshSceneList() {
		var fileSelect = this.$fileSelect;
		fileSelect.clear()
		Editor.assetdb.queryAssets(null, 'scene', function (err, scenes) {
			if (scenes) {
				scenes.forEach(function (scene) {
					if (scene.path.toLowerCase().indexOf('template') >= 0) {
						fileSelect.addItem(scene.uuid, Path.basename(scene.path,".fire"));
					}
				});
			}
		});
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		this.refreshSceneList();

		this.$createBtn.addEventListener('confirm', () => {
			Editor.Ipc.sendToMain('scene-template:clicked',  this.$fileSelect.value);
		});
		this.$refreshBtn.addEventListener('confirm', () => {
			this.refreshSceneList();
		});
	},

	// register your ipc messages here
	messages: {
	}
});