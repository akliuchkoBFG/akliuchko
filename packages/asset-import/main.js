'use strict';

const fs = require('fire-fs');
const path = require('path');
const TEMP_DIR = path.join(Editor.projectInfo.path, 'assets', 'imports');

module.exports = {
	load () {
		// execute when package loaded
		fs.ensureDirSync(TEMP_DIR);
	},

	unload () {
		// execute when package unloaded
	},

	// register your ipc messages here
	messages: {
		'open' () {
			Editor.Panel.open('asset-import');
		},
	},
};