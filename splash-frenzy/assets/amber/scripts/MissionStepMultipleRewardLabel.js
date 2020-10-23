const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');
const MissionStepAutoClaimController = require('MissionStepAutoClaimController');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Add Mission Component/Step Reward Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SPP/pages/562528442/Mission+Step+Reward+Label'
    },
    
    properties: {
        missionStepAutoClaimController: {
            default: null,
            type: MissionStepAutoClaimController,
        },
        awardIndex: {
            default: 0,
            type: cc.Integer,
        },
        activeAwardKey: {
            default: 'ProductPackageItemChips',
            visible: false,
        }
    },

	onUpdateMissionStepData: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
		if (!rtLabel.templateString || rtLabel.templateString == '') {
			rtLabel.templateString = 'You Won: {amount} {name}';
        }
        
        if (this.missionStepAutoClaimController) {
            this.awardIndex = this.missionStepAutoClaimController.awardAnimationIndex;
            this.numberOfAwards = this.missionStepAutoClaimController.awardItems.length;
            this.activeAwardKey = this.missionStepAutoClaimController.awardAnimationKey;
        }
		this._populateRTData(rtLabel);
	},

	_populateRTData: function(rtLabel) {
        let allAwardsData = this.missionStepInterface.getAwardData();
        if ((this.awardIndex <= this.numberOfAwards) && this.activeAwardKey) {
            const packageData = allAwardsData[this.activeAwardKey][0];
            const packageInfo = this._getAwardFromProductPackage(this.activeAwardKey, packageData);
            
            if (packageInfo) {
                const name = packageInfo.nameText;
                const amount = packageInfo.amountText(packageData);
                // Set both the template data and test data for previewing
                const data = {name: name, amount: amount};
                rtLabel.setData(data);
                rtLabel.testData = JSON.stringify(data);
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
