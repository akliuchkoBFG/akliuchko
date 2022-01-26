const TAG = "MissionRewardTeaser";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Reward Teaser',
	},

	properties: {
		rewardPrefabs: {
			type: [cc.Prefab],
			default: [],
			tooltip: [
				"MissionRewardSequenceItem prefabs.",
				"Component selects the last prefab in the list that satisfies all filters for the highest value reward",
				"Rewards without a valid prefab will be skipped",
			].join('\n'),
		},
		debugLogging: {
			default: false,
			tooltip: "Enables extra console logging that identifies which reward was selected or skipped and which prefab is used",
		},
	},

	setRewardsFromProductPackage(rewardItems) {
		if (CC_EDITOR) {
			return; // Dynamic rewards displays are not supported in-editor
		}
		if (_.isEqual(this._productPackage, rewardItems)) {
			return; // Attempting to configure this component multiple times with the same product package
		} else if (this._rewardNode) {
			// Cleanup previously configured reward
			this._rewardNode.removeFromParent();
			this._rewardNode = null;
		}
		this._productPackage = rewardItems;
		const items = [];
		_.forOwn(rewardItems, (productPackageConfigs, productPackageType) => {
			productPackageConfigs.forEach((config) => {
				const itemModel = PremiumItemModel.createItemWithProductPackageConfig(productPackageType, config);
				config.productPackageType = productPackageType;
				const rewardItem = {
					itemData: config,
					premiumItem: itemModel,
				};
				items.push(rewardItem);
			});
		});
		this._rewardItems = items;
		this._addRewardTeaser();
	},

	_addRewardTeaser() {
		const sortedRewards = _.sortBy(
			this._rewardItems,
			(rewardItem) => {
				return rewardItem.itemData && rewardItem.itemData.order;
			}
		);
		// Design says highest priority rewards are at the end of a sequence
		// Grab the last reward that has a valid prefab to instantiate
		let rewardNode;
		for (var i = sortedRewards.length - 1; i >= 0; i--) {
			const rewardItem = sortedRewards[i];
			rewardNode = this._createRewardNode(rewardItem);
			if (rewardNode) {
				break;
			} else if (this.debugLogging) {
				// Could not find a prefab that supports this reward
				// This may be expected depending on the sequence configuration and reward type
				this.log.d(this.node.name + " Skipping unsupported reward: " + JSON.stringify(rewardItem.itemData));
			}
		}
		if (rewardNode) {
			rewardNode.opacity = 0;
			this.node.addChild(rewardNode);
			rewardNode.getComponent(MissionRewardSequenceItem).loadItem()
			.then(() => {
				rewardNode.opacity = 255;
			});
			this._rewardNode = rewardNode;
		} else {
			this.log.e("No eligible reward prefab for rewards: " + JSON.stringify(this._rewardItems));
		}
	},

	_createRewardNode(rewardItem) {
		let rewardNode = null;
		for (let i = this.rewardPrefabs.length - 1; i >= 0; i--) {
			const prefab = this.rewardPrefabs[i];
			if (!prefab) {
				continue;
			}
			const prefabNode = prefab.data;
			const sequenceItemTemplate = prefabNode.getComponent(MissionRewardSequenceItem);
			if (!sequenceItemTemplate) {
				this.log.e("Prefab missing required MissionRewardSequenceItem component: " + prefab.name);
				continue;
			}
			if (sequenceItemTemplate.supportsItem(rewardItem.itemData, rewardItem.premiumItem)) {
				if (this.debugLogging) {
					this.log.d(`${this.node.name} Selected prefab '${prefab.name}' to display reward: ` + JSON.stringify(rewardItem.itemData));
				}
				rewardNode = cc.instantiate(prefab);
				const sequenceItem = rewardNode.getComponent(MissionRewardSequenceItem);
				sequenceItem.setReward(rewardItem.itemData, rewardItem.premiumItem);
				return rewardNode;
			}
		}
	},
});
