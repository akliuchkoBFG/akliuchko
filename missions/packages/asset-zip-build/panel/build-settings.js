(() => {
/* eslint-disable global-require */
const fs = require('fs');
const BuildSettings = Editor.require('packages://asset-zip-build/BuildSettings.js');
/* eslint-enable global-require */

const FILES = {
	html: Editor.url('packages://asset-zip-build/panel/build-settings.html'),
	style: Editor.url('packages://asset-zip-build/panel/build-settings.css'),
};

function createVue(elem, buildSettings) {
	return new Vue({
		el: elem,
		data: {
			showDebugInPanel: false,
			userSettings: Object.assign({}, buildSettings),
		},
		methods: {
			resetToDefaults() {
				Object.assign(this.userSettings, BuildSettings.DEFAULT_BUILD_SETTINGS);
			},
			save() {
				BuildSettings.saveToFile(this.userSettings);
				Editor.success("Saved build settings");
			},
		},
	});
}

// panel/index.js, this filename needs to match the one registered in package.json
return Editor.Panel.extend({
	// css style for panel
	style: fs.readFileSync(FILES.style),

	// html template for panel
	template: fs.readFileSync(FILES.html),

	// element and variable binding
	$: {
		wrap: '#wrap',
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		const settings = BuildSettings.getSettings();
		this.vue = createVue(this.$wrap, settings);
	},

	// register your ipc messages here
	messages: {
	}
});
})();