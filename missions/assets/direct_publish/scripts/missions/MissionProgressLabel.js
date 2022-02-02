const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Labels/Missions/Progress Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562593870/Mission+Progress+Label'
	},

	start: function() {
		this.onUpdateMissionStepData();
	},

	onUpdateMissionStepData: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
		if (!rtLabel.templateString || rtLabel.templateString == '') {
			rtLabel.templateString = '{progress} / {max}';
		}
		this._populateRTData(rtLabel);
	},

	_populateRTData: function(rtLabel) {
		// Grab the mission data using the interface
		let progress = this.missionStepInterface.getProgressAmount();
		let max = this.missionStepInterface.getProgressMax();
		progress = ProductPackageItemConfig.numberAsShortString(progress, '', true);
		max = ProductPackageItemConfig.numberAsShortString(max, '', true);
		let data = {progress: progress, max: max};
		rtLabel.setData(data);

		// Set the editor mode properties
		rtLabel.testData = JSON.stringify(data, null, '\t');
	}
});
