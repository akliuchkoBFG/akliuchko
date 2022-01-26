(() => {
/* eslint-disable global-require */
const fs = require('fire-fs');
const PigbeeRequest = Editor.require('packages://pigbee-utils/PigbeeRequest.js');
/* eslint-enable global-require */

const FILES = {
	html: Editor.url('packages://scene-archive/panel/archive-import.html'),
};

function getContentArchiveList(selectedEnv, filters) {
	const env = selectedEnv || 'tools';

	const formData = {};
	if (filters) {
		formData.filters = JSON.stringify(filters);
	}

	return PigbeeRequest.post({
		env: env,
		controller: 'cocos_creator',
		action: 'getPublishedContentArchives',
		formData: formData,
	}).then((response) => {
		const result = JSON.parse(response);
		return result.archives;
	});
}

return Editor.Panel.extend({
	// css style for panel
	style: `
	:host { margin: 5px; }
	h2 { color: #f90; }
	`,

	// html template for panel
	template: fs.readFileSync(FILES.html),

	// element and variable binding
	$: {
		wrap: '#wrap',
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		this.vue = new Vue({
			el: this.$wrap,
			data: {
				env: 'tools',
				searchValue: '',
				selectedZipPath: '',
				state: 'compiling',
				lastError: '',
				displayedArchives: [],
			},
			computed: {
				validScene() {
					return this.selectedZipPath !== '';
				},
			},
			compiled() {
				this.refreshSceneList();
			},
			methods: {
				_getFilters() {
					let filters = null;
					if (this.searchValue) {
						filters = {
							latestVersion: true,
							nameSearch: this.searchValue,
						};
					}
					return filters;
				},

				refreshSceneList() {
					if (this.state === 'loading') {
						Editor.warn("Refresh in progress");
						return;
					}
					const filters = this._getFilters();
					this.state = 'loading';

					getContentArchiveList(this.env, filters).then((archives) => {
						this.state = 'complete';
						this.displayedArchives = archives;
					})
					.catch((err) => {
						Editor.failed("Can't get list of content archives\n" + err);
						this.lastError = err;
						this.state = 'error';
					});
				},

				doImport() {
					if (!this.selectedZipPath) {
						Editor.failed("Unable to import zip, none selected");
						return;
					}
					Editor.Ipc.sendToMain('scene-archive:import-archive', this.selectedZipPath);
				},
			},
		});
	},

	// register your ipc messages here
	messages: {
	}
});

})();