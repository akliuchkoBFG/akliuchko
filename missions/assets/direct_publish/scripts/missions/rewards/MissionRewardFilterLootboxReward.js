const MissionRewardFilter = require('MissionRewardFilter');
const EditorLabelProperty = require('EditorLabelProperty');

const DESCRIPTION = `This filter matches only Lootbox type rewards that have already been claimed
Use the "Product Package Type" filter for matching lootboxes that are not yet opened`;

cc.Class({
	extends: MissionRewardFilter,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Filters/Lootbox Reward',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		editorDescription: {
			get() {
				if (!this._editorDescription) {
					this._editorDescription = new EditorLabelProperty(DESCRIPTION);
				}
				return this._editorDescription;
			},
			type: EditorLabelProperty,
		},
	},

	// @Override
	// Filters eligible items to the appropriate MissionRewardSequenceItem prefabs in a MissionRewardSequence
	supportsItem(itemData, premiumItemModel) {
		// Only allow lootbox rewards that have data from being claimed
		return itemData.productPackageType === 'ProductPackageItemLootBox' && itemData.awardResult;
	},
});
