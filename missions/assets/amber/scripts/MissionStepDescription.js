const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Add Mission Component/Step Description Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SPP/pages/562692173/Mission+Step+Description+Label'
	},

	_populateRTData: function(rtLabel) {
		// Grab the mission data using the interface
		const slotName = this._getSlotName();
		const giftName = this._getGiftName();
		const currency = (!CC_EDITOR && Game.isSlotzilla()) ? 'COINS' : 'CHIPS';
		let progress = this.missionStepInterface.getProgressAmount();
		progress = ProductPackageItemConfig.numberAsShortString(progress, '', true);
		let max = this.missionStepInterface.getProgressMax();
		max = ProductPackageItemConfig.numberAsShortString(max, '', true);
		let minBet = this.missionStepInterface.getMinBet() || 0;
		minBet = ProductPackageItemConfig.numberAsShortString(minBet, '', true);
		let remaining = this.setRemaining();

		const data = {
			progress: progress, 
			max: max,
			remaining: remaining,
			slotname: slotName.toUpperCase(), 
			giftname: giftName,
			minbet: minBet, 
			currencyUpper: currency,
			currencyLower: currency.toLowerCase(),
		};
		rtLabel.setData(data);
		// Set the editor mode properties
		rtLabel.testData = JSON.stringify(data);
	},

	setRemaining: function () {
		let remainingAmount = 0;
		let progress = this.missionStepInterface.getProgressAmount();
		let max = this.missionStepInterface.getProgressMax();

		remainingAmount = progress && max ? max - progress : max;
		remainingAmount = ProductPackageItemConfig.numberAsShortString(remainingAmount, '', true);
		return remainingAmount;
	},

	onUpdateMissionStepData: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
        let description = this.missionStepInterface.getFormatString();
        let templateClassType = this.missionStepInterface && 
                                this.missionStepInterface._stepData &&
								this.missionStepInterface._stepData.class;
		this.isProgress = this.missionStepInterface &&
						  this.missionStepInterface._stepData &&
						  this.missionStepInterface._stepData.data.progress != 0;

		const templateClassTypeStr = templateClassType.toString();
		
		let templateType = this.isProgress ? 
			this.setProgressTemplateString(templateClassTypeStr) : 
			this.setTemplateString(templateClassTypeStr);

		if (!templateType && (!rtLabel.templateString || rtLabel.templateString == '')) {
			rtLabel.templateString = description;
        } else {
            rtLabel.templateString = templateType;
        }

		this._populateRTData(rtLabel);
	},

	_getSlotName: function() {
		const buyInIDs = this.missionStepInterface.getBuyInIDs();
		let slotData;
		
		if (buyInIDs) {
			slotData = buyInIDs && this.missionStepInterface.getSlotData(buyInIDs[0]);
		} else {
			const allSlotData = this.missionStepInterface.missionInterface._missionData && 
				this.missionStepInterface.missionInterface._missionData.slotsData;
			slotData = allSlotData && allSlotData[Object.keys(allSlotData)[0]];
		}
		return slotData && slotData.name;
	},

	_getGiftName: function() {
		const giftData = this.missionStepInterface.missionInterface.getGiftsData();
		const giftIDs = this.missionStepInterface.getGiftIDs();
		if (giftData && giftIDs) {
			const id = giftIDs[0];
			return giftData[id] && giftData[id].name.toUpperCase();
		}
    },

	// TO DO * refactor this;
    setTemplateString: function (type) {
		let value = '';
		const color = '#fff447';
		const outlineColor = '#0b1336';
        switch (type) {
            case 'MissionStepBet':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Bet a total of {max} {currencyUpper} on slot {slotname} </outline>`
                break;
            case 'MissionStepSpin':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Spin {max} times with a minimum bet of {minBet} on slot {slotname} </outline>`
                break;
            case 'MissionStepWinsThreshold':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Collect {max} wins over {threshold} on slot {slotname} </outline>`
                break;
            case 'MissionStepWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Win {max} {currencyUpper} in {spinCount} consecutive spins on slot {slotname} </outline>`
                break;
            case 'MissionStepBigWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Collect {max} big wins on slot {slotname}</outline>`
                break;
            case 'MissionStepGiftGiving':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Give {max} {giftname} </outline>`
                break;
            default:
				value = `<color=${color}><b></color><outline color=${outlineColor} width=2>Step in {slotname} </outline>`
                break;
		}
        return value;
	},
	
	setProgressTemplateString: function (type) {
		let value = '';
		const color = '#fff447';
		const outlineColor = '#0b1336';
        switch (type) {
            case 'MissionStepBet':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>BET ANOTHER  {remaining} {currencyUpper} ON SLOT {slotname}, TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepSpin':
				value = `<color=${color}><b></color><outline color=${outlineColor} width=2>SPIN {remaining} TIME WITH A MINIMUM BET OF {minBet} ON SLOT {slotname}, TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepWinsThreshold':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>COLLECT ANOTHER {remaining} WINS OVER {threshold} ON SLOT {slotname}, TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>WIN {max} {currencyUpper} IN, SPIN {spinCount} CONSECUTIVE SPINS ON SLOT {slotname}</outline>`
                break;
            case 'MissionStepBigWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>COLLECT ANOTHER {remaining} BIG WINS ON SLOT {slotname}, TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepGiftGiving':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=2>GIVE {remaining} MORE {giftname}, TO COMPLETE THIS STEP!</outline>`
                break;
            default:
				value = `<color=${color}><b></color><outline color=${outlineColor} width=2>COMPLETE THIS STEP IN SLOT {slotname}!</outline>`
                break;
		}
        return value;
    }
});