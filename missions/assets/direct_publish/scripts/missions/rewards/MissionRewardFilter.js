/* eslint-disable no-unused-vars*/
cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {

	},

	properties: {
	},

	// @Override
	// Filters eligible items to the appropriate MissionRewardSequenceItem prefabs in a MissionRewardSequence
	supportsItem(itemData, premiumItemModel) {
		return true;
	},
});
