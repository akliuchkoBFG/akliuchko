

// Data Provider: This is the default provider to send data to our interface via the LoadData

const MissionDataProvider = require('MissionDataProvider');
const LoadData = require('LoadDataV2').mixinExpectedProperties([
	'missionData', // we can optionally pass in a promise as missionData
]);

const LoadingComponent = require('LoadingComponent');

const TAG = "missionDataProviderLoadData";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: MissionDataProvider,

	mixins: [LoadData, ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Mission Load Data',
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/495583779/Mission+Data+Provider+Load+Data'
	},

	properties: {
	},

	onLoad: function() {
	},

	getMissionData(missionDataIndex) {
		let loadingPromise = Promise.resolve(null);
		if (!CC_EDITOR) {
			if (this.loadData && this.loadData.missionData) {
				loadingPromise = Promise.resolve(this.loadData.missionData);
			} else {
				this.log.e("Expected loadData was not found... is MissionDataProviderLoadData the expected data provider?");
			}
			LoadingComponent.addLoadingTask(this, loadingPromise);
		}

		return loadingPromise.then((missionData) => {
			if (missionData && missionData[missionDataIndex]) {
				return missionData[missionDataIndex];
			} else {
				this.log.e("Mission data for mission " + missionDataIndex + " not found");
			}
			return null;
		});
	},
});