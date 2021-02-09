const TAG = "MissionRewardSequenceItemDataTemplate";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');
const DataTemplateLabel = require('DataTemplateLabel');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');

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
		},
		templateRichTexts: {
			default: [],
			type: [DataTemplateRichTextLabel],
		},
	},

	setReward(itemData, premiumItemModel) {
		// Add and convert amounts to human readable options
		itemData.amountShort = SAStringUtil.numberAsShortString(itemData.amount);
		itemData.amountFormat = SAStringUtil.formatNumber(itemData.amount);
		this._super(itemData, premiumItemModel);
		this.templateLabels.forEach((templateLabel) => {
			templateLabel.setData(itemData);
		});
		this.templateRichTexts.forEach((templateRichText) => {
			templateRichText.setData(itemData);
		});
	},
});
