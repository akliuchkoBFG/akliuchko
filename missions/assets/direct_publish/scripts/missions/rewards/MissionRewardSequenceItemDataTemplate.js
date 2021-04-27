const TAG = "MissionRewardSequenceItemDataTemplate";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');
const DataTemplateLabel = require('DataTemplateLabel');

cc.Class({
	extends: MissionRewardSequenceItem,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Sequence/Sequence Item Data Template',
	},

	properties: {
		templateLabels: {
			default: [],
			type: [DataTemplateLabel],
			tooltip: [
				'Template Labels or RichTexts that receive product package data',
				'Valid data keys are product package data values in addition to: amountShort, amountFormat, currencyUpper, currencyLower',
			].join('\n'),
		},
	},

	setReward(itemData, premiumItemModel) {
		// Add and convert amounts to human readable options
		itemData.amountShort = SAStringUtil.numberAsShortString(itemData.amount);
		itemData.amountFormat = SAStringUtil.formatNumber(itemData.amount);
		// Add currency values for assistance displaying currency reward info
		itemData.currencyUpper = (!CC_EDITOR && Game.isSlotzilla()) ? 'COINS' : 'CHIPS';
		itemData.currencyLower = itemData.currencyUpper.toLowerCase();
		this._super(itemData, premiumItemModel);
		this.templateLabels.forEach((templateLabel) => {
			templateLabel.setData(itemData);
		});
	},
});
