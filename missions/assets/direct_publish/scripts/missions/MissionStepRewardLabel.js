const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Add Mission Component/Step Reward Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562528442/Mission+Step+Reward+Label'
	},

	onUpdateMissionStepData: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
		if (!rtLabel.templateString || rtLabel.templateString == '') {
			rtLabel.templateString = 'You Won: {amount} {name}';
		}
		
		this._populateRTData(rtLabel);
	},

	_populateRTData: function(rtLabel) {
		// Note: This currently uses just the first valid ProductPackageItem
		let allAwardsData = this.missionStepInterface.getAwardData();
		for (let packageType in allAwardsData) {
			const packageData = allAwardsData[packageType][0];
			const packageInfo = this._getAwardFromProductPackage(packageType, packageData);
			
			if (packageInfo) {
				const name = packageInfo.nameText;
				const amount = packageInfo.amountText(packageData);
				// Set both the template data and test data for previewing
				const data = {name: name, amount: amount};
				rtLabel.setData(data);
				rtLabel.testData = JSON.stringify(data);
				break;
			}
		}
	},

	_getAwardFromProductPackage(packageType, packageData) {
		const configData = ProductPackageItemConfig[packageType];
		// Attempt to grab the package info based on the award type
		if (configData.default) {
			return configData.default;
		}
		const typeKey = configData.typeKey;
		if (configData.typeKey) {
			if (packageData[typeKey]) {
				return configData[packageData[typeKey]];
			}
		}
	},
});
