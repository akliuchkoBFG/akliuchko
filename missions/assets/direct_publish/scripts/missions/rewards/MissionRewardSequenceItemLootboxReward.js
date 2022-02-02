const TAG = "MissionRewardSequenceItemLootbox";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardFilter = require('MissionRewardFilter');

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');
const MissionRewardSequence = require('MissionRewardSequence');

cc.Class({
	extends: MissionRewardSequenceItem,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Rewards/Items/Lootbox Reward Item',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		requireComponent: MissionRewardSequence,
	},

	properties: {
	},

	loadItem() {
		return this._loadingPromise || Promise.resolve();
	},

	supportsItem(itemData, premiumItemModel) {
		// Equivalent logic to MissionRewardFilterLootboxReward, but there's no way to require multiple components
		if (itemData.productPackageType !== 'ProductPackageItemLootBox' || !itemData.awardResult) {
			return false;
		}
		const filters = this.getComponents(MissionRewardFilter);
		for (const filter of filters) {
			if (!filter.supportsItem(itemData, premiumItemModel)) {
				return false;
			}
		}
		return true;
	},

	setReward(itemData/* , premiumItemModel*/) {
		this._itemData = itemData;
		const awardedPackageIndex = itemData.awardResult.result.productPackageIndex;
		const productPackageID = itemData.lootbox[awardedPackageIndex].productPackageID;
		this._awardedProductPackage = itemData.promoData.lootbox[productPackageID];
		const sequence = this.getComponent(MissionRewardSequence);
		sequence.setRewardsFromProductPackage(this._awardedProductPackage);
	},

	playItem() {
		return this.loadItem()
		.then(() => {
			return this.intro.play();
		})
		.then(() => {
			return this.getComponent(MissionRewardSequence).playSequence();
		})
		.then(() => {
			return this.outro.play();
		}).catch((err) => {
			this.log.e("playItem failure: " + err);
			this.log.d("Reward item data: " + JSON.stringify(this._itemData));
			this.node.active = false;
		});
	},

	sample() {
		this.intro.sample();
	},
});
