
// Base Data Provider for passing data to the Mission Interface
//	extended for LoadData, Fetching, etc

const TAG = "missionDataProvider";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		executeInEditMode: true,
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/495583770/Mission+Data+Provider'
	},

	properties: {
	},

	onLoad: function() {
	},

	getMissionData(missionDataIndex) {
		this.log.w('Base Data Provider sends no data');
		return Promise.resolve(null);
	},
});