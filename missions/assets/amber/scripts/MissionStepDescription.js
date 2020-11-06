const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
	},

	properties: {
		textColor: '#fff447',
		outlineColor: '#0b1336',
		outlineWidth: '2',
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
		let minBet = this.missionStepInterface.getMinBet() || '1000';
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
		let remaining = this.setRemaining();
		this.singularAmount = remaining == 1;

		let staticTemplateTypeString = this.isProgress ? 
			this.setProgressTemplateString(templateClassTypeStr) : 
			this.setTemplateString(templateClassTypeStr);

		if (!this.isProgress && staticTemplateTypeString) {
			let styledDescription = this.styleDescriptionString(description);
			rtLabel.templateString = description ? styledDescription : staticTemplateTypeString;
        } else {
            rtLabel.templateString = staticTemplateTypeString;
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

	styleDescriptionString: function (text) {
		let color = this.textColor;
		let outline = this.outlineColor;
		let outlineWidth = this.outlineWidth;
		if (text) {
			return `<color=${color}><b></color><outline color=${outline} width=${outlineWidth}>${text}</outline>`;
		}
	},

	// TO DO * refactor this hardcoded text;
    setTemplateString: function (type) {
		let value = '';
		const color = this.textColor;
		const outlineColor = this.outlineColor;
		const outlineWidth = this.outlineWidth;
        switch (type) {
            case 'MissionStepBet':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Bet a total of {max} {currencyUpper} on slot {slotname} </outline>`
                break;
            case 'MissionStepSpin':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Spin {max} times on slot {slotname}</outline>`
                break;
            case 'MissionStepWinsThreshold':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Collect {max} wins over {threshold} on slot {slotname} </outline>`
                break;
            case 'MissionStepWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Win {max} {currencyUpper} in {spinCount} consecutive spins on slot {slotname} </outline>`
                break;
            case 'MissionStepBigWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Collect {max} big wins on slot {slotname}</outline>`
                break;
            case 'MissionStepGiftGiving':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Give {max} {giftname} </outline>`
				break;
			case 'MissionStepBingo':
				value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Mark Bingo board {max} times on slot {slotname} </outline>`
				break;
            default:
				value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>Step in {slotname} </outline>`
                break;
		}
        return value;
	},
	
	setProgressTemplateString: function (type) {
		let value = '';
		const color = this.textColor;
		const outlineColor = this.outlineColor;
		const outlineWidth = this.outlineWidth;
		const timeString = this.singularAmount ? 'TIME' : 'TIMES';
		const winString = this.singularAmount ? 'WIN' : 'WINS';

        switch (type) {
            case 'MissionStepBet':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>BET ANOTHER {remaining} {currencyUpper} <br/>ON SLOT {slotname} <br/>TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepSpin':
				value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>SPIN AGAIN {remaining} ${timeString} <br/>ON SLOT {slotname} <br/>TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepWinsThreshold':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>COLLECT ANOTHER {remaining} ${winString} <br/>OVER {threshold} ON SLOT {slotname} <br/>TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>WIN {max} {currencyUpper} <br/>SPIN {spinCount} CONSECUTIVE SPINS ON SLOT {slotname}</outline>`
                break;
            case 'MissionStepBigWins':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>COLLECT {remaining} MORE BIG ${winString} <br/>ON SLOT {slotname} <br/>TO COMPLETE THIS STEP!</outline>`
                break;
            case 'MissionStepGiftGiving':
                value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>GIVE {remaining} MORE {giftname} <br/>TO COMPLETE THIS STEP!</outline>`
				break;
			case 'MissionStepBingo':
				value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>MARK BINGO BOARD ANOTHER {remaining} ${timeString} ON SLOT {slotname} <br/>TO COMPLETE THIS STEP!</outline>`
				break;
            default:
				value = `<color=${color}><b></color><outline color=${outlineColor} width=${outlineWidth}>COMPLETE THIS STEP IN SLOT {slotname}!</outline>`
                break;
		}
        return value;
    }
});