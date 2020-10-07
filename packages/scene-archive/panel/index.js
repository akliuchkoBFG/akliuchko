(() => {
// panel/index.js, this filename needs to match the one registered in package.json
const request = require('request');

function getContentArchiveList(selectedEnv) {
	const env = selectedEnv || 'https://casino-tools.qa.bigfishgames.com:8080';
	const url = env + '/cocos_creator/getPublishedContentArchives';

	Editor.log('Selected environment ' + env);

	return new Promise((resolve) => {
		request.get({
			url: url,
		}, (err, respObj, response) => {
			Editor.log(response);
			try {
				const result = JSON.parse(response);
				resolve(result.archives);
			} catch(e) {
				Editor.error("Can't get list of content archives");
				resolve([]);
			}
		});
	});
};

return Editor.Panel.extend({
	// css style for panel
	style: `
	:host { margin: 5px; }
	h2 { color: #f90; }
	`,

	// html template for panel
	template: `
		<h2>Import Scene from Archive</h2>
		<hr />
		Environment:
		<ui-select id="envSelect">
			<option value="https://casino-admin.sea.bigfishgames.com">Live</option>
			<option value="https://casino-tools.qa.bigfishgames.com:8080">Tools</option>
			<option value="https://casino-admin.qa.bigfishgames.com">Features</option>
		</ui-select>
		<hr />
		Scene:
		<ui-select id="sceneSelect"></ui-select>
		<hr />
		<ui-button id="importBtn">Import</ui-button>
		<ui-button id="refreshBtn">Refresh</ui-button>
		`,

	// element and variable binding
	$: {
		refreshBtn: '#refreshBtn',
		sceneSelect: '#sceneSelect',
		importBtn: '#importBtn',
		envSelect: '#envSelect'
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		this.$refreshBtn.addEventListener('confirm', () => {
			this.refreshSceneList();
		});
		this.$importBtn.addEventListener('confirm', () => {
			Editor.Ipc.sendToMain('scene-archive:import-archive',  this.$sceneSelect.value);
		});
		this.$envSelect.addEventListener('change', () => {
			this.refreshSceneList();
		});

		this.refreshSceneList();
	},

	refreshSceneList: function() {
		if (this.refreshPromise) {
			Editor.warn("Refresh in progress");
			return;
		}

		const sceneSelect = this.$sceneSelect;
		sceneSelect.clear();
		sceneSelect.addItem("Loading...");

		this.refreshPromise = getContentArchiveList(this.$envSelect.value).then((archives) => {
			sceneSelect.clear();
			_.forEach(archives, (archive) => {
				// @TODO: create a better versioning scheme
				sceneSelect.addItem(archive.zipPath, archive.name);
			});
			this.refreshPromise = null;
		});
	},

	// register your ipc messages here
	messages: {
	}
});

})();