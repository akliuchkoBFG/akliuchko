const MissionRewardFilter = require('MissionRewardFilter');

const ProductPackageTypes = cc.Enum({
	ProductPackageItemChips: 1,
	ProductPackageItemBoost: 2,
	ProductPackageItemClubChips: 3,
	ProductPackageItemCollectionChest: 4,
	ProductPackageItemCollectionFrames: 5,
	ProductPackageItemCollectionTokens: 6,
	ProductPackageItemCollectionTrophies: 7,
	ProductPackageItemEntrytext: 8,
	ProductPackageItemFreeSpins: 9,
	ProductPackageItemGift: 10,
	ProductPackageItemGold: 11,
	ProductPackageItemLootBox: 12,
	ProductPackageItemMissionUnlock: 13,
	ProductPackageItemMysteryPrize: 14,
	ProductPackageItemBooster: 15,
	ProductPackageItemMissionPoints: 16,
});

cc.Class({
	extends: MissionRewardFilter,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Filters/Product Package Type',
	},

	properties: {
		type: {
			default: ProductPackageTypes.ProductPackageItemChips,
			type: ProductPackageTypes,
			tooltip: 'Type of product package to allow for this sequence item prefab',
		},
	},

	// @Override
	// Filters eligible items to the appropriate MissionRewardSequenceItem prefabs in a MissionRewardSequence
	supportsItem(itemData/* , premiumItemModel*/) {
		const typeName = ProductPackageTypes[this.type];
		return typeName === itemData.productPackageType;
	},
});
