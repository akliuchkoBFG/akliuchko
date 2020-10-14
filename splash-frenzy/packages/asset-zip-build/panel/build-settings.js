(() => {
const fs = require('fs');
const BuildSettings = require(Editor.url('packages://asset-zip-build/BuildSettings.js'));

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
			prevEnvironments: [
				{text:'localVM', value: buildSettings.pigbeeEnv + '.qa'},
				{text:'tools', value: 'casino-tools.qa'},
				{text:'stage', value: 'casino-stage'},
				{text:'live', value: 'casino'},
				{text:'features01', value: 'casino-features01.qa'},
				{text:'features02', value: 'casino-features02.qa'},
				{text:'features03', value: 'casino-features03.qa'},
				{text:'features04', value: 'casino-features04.qa'},
				{text:'features05', value: 'casino-features05.qa'},
				{text:'features06', value: 'casino-features06.qa'},
				{text:'features07', value: 'casino-features07.qa'},
				{text:'features08', value: 'casino-features08.qa'},
				{text:'features09', value: 'casino-features09.qa'},
				{text:'features10', value: 'casino-features10.qa'},
				{text:'features11', value: 'casino-features11.qa'},
				{text:'features12', value: 'casino-features12.qa'},
				{text:'features13', value: 'casino-features13.qa'},
				{text:'features14', value: 'casino-features14.qa'},
				{text:'features15', value: 'casino-features15.qa'},
				{text:'features16', value: 'casino-features16.qa'},
			],
			prevEnvSelected: buildSettings.previewEnv || 'casino-tools.qa',

		},
		methods: {
			resetToDefaults() {
				Object.assign(this.userSettings, BuildSettings.DEFAULT_BUILD_SETTINGS);
			},
			save() {
				this.userSettings.previewEnv = this.prevEnvSelected;
				BuildSettings.saveToFile(this.userSettings);
				Editor.log("Save");
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