const MissionRewardFilter = require('MissionRewardFilter');
cc.Class({
	extends: MissionRewardFilter,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Filters/Is Premium Item',
	},

	properties: {
	},

	// @Override
	// Filters eligible items to the appropriate MissionRewardSequenceItem prefabs in a MissionRewardSequence
	supportsItem(itemData, premiumItemModel) {
		return premiumItemModel instanceof PremiumItemModel;
	},
});
