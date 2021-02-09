const MissionRewardFilter = require('MissionRewardFilter');
const MissionRewardFilterIsPremiumItem = require('MissionRewardFilterIsPremiumItem');

const PremiumItemTypes = cc.Enum({
	frame: 1,
	trophy: 2,
	token: 3,
	chest: 4,
	freeSpins: 5,
	entrytext: 6,
	gift: 7,
	chips: 8,
});

cc.Class({
	extends: MissionRewardFilter,

	editor: CC_EDITOR && {
		requireComponent: MissionRewardFilterIsPremiumItem,
		menu: 'Add Mission Component/Rewards/Filters/Premium Item Type',
	},

	properties: {
		type: {
			default: PremiumItemTypes.frame,
			type: PremiumItemTypes,
			tooltip: 'Type of premium item to allow for this sequence item prefab',
		},
	},

	// @Override
	// Filters eligible items to the appropriate MissionRewardSequenceItem prefabs in a MissionRewardSequence
	supportsItem(itemData, premiumItemModel) {
		const typeName = PremiumItemTypes[this.type];
		return typeName === premiumItemModel.get('type');
	},
});
