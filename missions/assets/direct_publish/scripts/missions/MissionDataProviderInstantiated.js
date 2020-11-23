
// Data Provider for passing data to the Mission Interface instantiated in code
//	extended for LoadData, Fetching, etc

const MissionDataProvider = require('MissionDataProvider');

const TAG = "missionDataProviderInstantiated";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: MissionDataProvider,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Mission Intantiated Data',
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/495583770/Mission+Data+Provider'
	},

	properties: {
	},

	ctor: function () {
		this._promise = new Promise((resolve) => {
			this._resolver = resolve;
		});
	},

	onLoad: function() {
	},

	getMissionData(missionDataIndex) {
		return this._promise;
	},

	setMissionData(missionData) {
		this._resolver(missionData);
	}
});