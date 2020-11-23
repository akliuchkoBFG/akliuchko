const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(Editor.projectInfo.path, 'temp', 'sag');
const DEFAULT_BUILD_SETTINGS = {
	outputDir: TEMP_DIR,
	skipZip: false,
	skipArchive: false,
	skipUpload: false,
	debug: false,
	cleanup: true,
	bundleNameOverride: '',
	includeSource: false,
	minify: true,
};

const SAVED_SETTINGS_PATH = Editor.url("profile://local/asset-zip-build-settings.json");

const BuildSettings = {
	DEFAULT_BUILD_SETTINGS: DEFAULT_BUILD_SETTINGS,
	loadFromFile() {
		let settings = {};
		try {
			settings = JSON.parse(fs.readFileSync(SAVED_SETTINGS_PATH));
		} catch (e) {
			// No settings file found
		}
		return settings;
	},
	saveToFile(settings) {
		fs.writeFileSync(SAVED_SETTINGS_PATH, JSON.stringify(settings, null, 2));
	},
	getSettings(settings) {
		settings = settings || {};
		const fileSettings = this.loadFromFile();
		// Priority: provided settings, saved settings, defaults
		return _.defaults(settings, fileSettings, DEFAULT_BUILD_SETTINGS);
	},
}

module.exports = BuildSettings;