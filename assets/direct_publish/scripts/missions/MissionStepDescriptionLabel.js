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

		const data = {
			progress: progress, 
			max: max, 
			slotname: slotName, 
			giftname: giftName,
			minbet: minBet, 
			currencyUpper: currency,
			currencyLower: currency.toLowerCase()
		};
		rtLabel.setData(data);
		// Set the editor mode properties
		rtLabel.testData = JSON.stringify(data);
	},

	onUpdateMissionStepData: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
		let description = this.missionStepInterface.getFormatString();
		if (!rtLabel.templateString || rtLabel.templateString == '') {
			rtLabel.templateString = description;
		}

		this._populateRTData(rtLabel);
	},

	_getSlotName: function() {
		const buyInIDs = this.missionStepInterface.getBuyInIDs();
		const slotData = buyInIDs && this.missionStepInterface.getSlotData(buyInIDs[0]);
		return slotData && slotData.name;
	},

	_getGiftName: function() {
		const giftData = this.missionStepInterface.missionInterface.getGiftsData();
		const giftIDs = this.missionStepInterface.getGiftIDs();
		if (giftData && giftIDs) {
			const id = giftIDs[0];
			return giftData[id] && giftData[id].name.toUpperCase();
		}
	}
});