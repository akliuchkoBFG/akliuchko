const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const ProductPackageItemConfig = require('ProductPackageItemConfig');

const StringType = cc.Enum({
	FormatString: 0,
	SlotName: 1,
});

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: cc.Label,
		executeInEditMode: true,
		menu: 'Add Mission Component/Step Description Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562692173/Mission+Step+Description+Label'
	},

	properties: {
		stringType: {
			default: StringType.FormatString,
			type: StringType,
			notify: function(old) {
				if (this.stringType !== old) {
					this.onUpdateMissionStepData();
				}
			}
		},
	},

	_formatLabel: function(string) {

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

		const PROPERTY_REGEX = /{(.*?)}/g;
		const formattedString = string.replace(PROPERTY_REGEX, (match, propertyName) => {
			return (data[propertyName] == null) ? '' : data[propertyName];
		});
		this.getComponent(cc.Label).string = formattedString;
	},

	onUpdateMissionStepData: function() {

		let string = {};
		switch(this.stringType) {
			case StringType.FormatString: 
				string = this.missionStepInterface.getFormatString(); 
				break;
			case StringType.SlotName: 
				string = "{slotname}"; 
				break;
		}
		this._formatLabel(string);
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