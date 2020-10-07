

// Data Provider: This is the default provider to send data to our interface via the LoadData

const MissionDataProvider = require('MissionDataProvider');
const LoadData = require('LoadDataV2').mixinExpectedProperties([
	'missionData'
]);


const TAG = "missionDataProviderLoadData";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: MissionDataProvider,

	mixins: [LoadData, ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Mission Load Data',
		executeInEditMode: true,
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SPP/pages/495583779/Mission+Data+Provider+Load+Data'
	},

	properties: {
	},

	onLoad: function() {
	},

	getMissionData(missionDataIndex) {
		if (this.loadData && this.loadData.missionData && this.loadData.missionData[missionDataIndex]) {
			return Promise.resolve(this.loadData.missionData[missionDataIndex]);
		} else {
			this.log.e("Load data for mission " + missionDataIndex + " not found");
		}
		return Promise.resolve(null);
	},
});