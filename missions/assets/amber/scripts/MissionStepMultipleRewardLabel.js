const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');
const MissionStepAutoClaimController = require('MissionStepAutoClaimController');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
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
			rtLabel.templateString = 'You Won: {amount} {name} in {slotname}!';
        }
        
        if (this.missionStepAutoClaimController) {
            this.awardIndex = this.missionStepAutoClaimController.playedAwardAnimationIndex;
            this.numberOfAwards = this.missionStepAutoClaimController.awardItems && this.missionStepAutoClaimController.awardItems.length;
            this.activeAwardKey = this.missionStepAutoClaimController.awardAnimationKey;
        }
		this._populateRTData(rtLabel);
	},

	_populateRTData: function(rtLabel) {
        let allAwardsData = this.missionStepInterface.getAwardData();

        if ((this.awardIndex <= this.numberOfAwards) && this.activeAwardKey) {
            const packageData = allAwardsData &&
                allAwardsData.hasOwnProperty(this.activeAwardKey) &&
                allAwardsData[this.activeAwardKey][0];
            const packageInfo = packageData && this._getAwardFromProductPackage(this.activeAwardKey, packageData);
            
            if (packageInfo) {
                const name = packageInfo.nameText;
                const amount = packageInfo.amountText(packageData);
                const slotName = this._getSlotName();
                const stepID = this.missionStepInterface.stepID;
                const character = stepID && this.getCharacterName(stepID);

                // Set both the template data and test data for previewing
                const data = {
                    name: name,
                    amount: amount,
                    slotname: slotName,
                    character: character,
                };
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
    
    _getSlotName: function() {
		const buyInIDs = this.missionStepInterface.getBuyInIDs();
		const anySlotMachineLabel = 'Any Slot Machine';
		let slotData;

		if (buyInIDs) {
			slotData = buyInIDs && this.missionStepInterface.getSlotData(buyInIDs[0]);
		} else {
			return anySlotMachineLabel;
		}
		
		return slotData && slotData.name;
    },

    getCharacterName: function (id) {
        let _id = id * 1;
		const characterComp = this.getComponent('StepMilestoneCharacters');
		if (characterComp) {
			let character = characterComp.getCharacters(_id);
			return character && character.name.toUpperCase();
		}
	}
});
