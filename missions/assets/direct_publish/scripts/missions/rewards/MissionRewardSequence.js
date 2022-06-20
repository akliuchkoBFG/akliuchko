const TAG = "MissionRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const AnimationClipProperty = require('AnimationClipProperty');
const ANIM_COMPONENT_PROPERTY = 'animation';

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');

const PRODUCT_PACKAGE_ITEM_CHIPS_TYPE = 'ProductPackageItemChips';

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Rewards/Reward Sequence',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		rewardPrefabs: {
			type: [cc.Prefab],
			default: [],
			tooltip: "MissionRewardSequenceItem prefabs. Each reward will select the last prefab in the list that satisfies all filters for the reward data"
		},

		debugLogging: {
			default: false,
			tooltip: "Enables extra console logging that identifies rewards that are skipped and which prefabs are used for which rewards",
		},

		// Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			[
				'intro',
				'transition',
				'outro',
			],
			[
				'Animation component for overall reward sequence animation states (optional)',
				'Adding this component will reveal states for intro, transition, and outro',
			].join('\n')
		),

		intro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for before individual rewards start cycling'
		),

		transition: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state that plays between each reward in a sequence'
		),

		outro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for after individual rewards have completed'
		),

		combineRewards:{
			default: true,
		}
	},

	setRewardsFromProductPackage(rewardItems) {
		if (CC_EDITOR) {
			return; // Dynamic rewards displays are not supported in-editor
		}

		if (_.isEqual(this._productPackage, rewardItems)) {
			return; // Attempting to configure this component multiple times with the same product package
		} else if (this._rewardItems) {
			// Cleanup previously configured rewards
			_(this._rewardItems)
			.map('rewardNode')
			.forEach((rewardNode) => {
				rewardNode.removeFromParent();
			});
		}
		//Combine rewards of the same type if this reward sequence is configured to do so
		if(this.combineRewards){
			rewardItems = this.consolidateProductPackageRewards(rewardItems);
		}
		this._rewardItems = [];
		this._productPackage = rewardItems;
		_.forOwn(rewardItems, (productPackageConfigs, productPackageType) => {
			productPackageConfigs.forEach((config) => {
				const itemModel = PremiumItemModel.createItemWithProductPackageConfig(productPackageType, config);
				config.productPackageType = productPackageType;
				const rewardItem = {
					itemData: config,
					premiumItem: itemModel,
				};
				const itemNode = this._createRewardNode(rewardItem);
				if (itemNode) {
					itemNode.opacity = 0;
					this.node.addChild(itemNode);
					rewardItem.rewardNode = itemNode;
					this._rewardItems.push(rewardItem);
				} else if (this.debugLogging) {
					// Could not find a prefab that supports this reward
					// This may be expected depending on the sequence configuration and reward type
					this.log.d(this.node.name + " Skipping unsupported reward: " + JSON.stringify(rewardItem.itemData));
				}
			});
		});
	},

	setRewardsFromAwardAndResult(award, awardResults) {
		const productPackageRewards = _.cloneDeep(award);
		const indexByClass = _.mapValues(productPackageRewards, () => { return 0; });
		awardResults.forEach((awardResult) => {
			const className = awardResult.class;
			const currentIndex = indexByClass[className]++;
			productPackageRewards[className][currentIndex].awardResult = awardResult;
		});
		this.setRewardsFromProductPackage(productPackageRewards);
	},

	hasItems() {
		return this._rewardItems && this._rewardItems.length > 0;
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

	playSequence() {
		return this.intro.play()
		.then(() => {
			this.emit('reward-sequence.intro-complete');
			return this._playItems();
		})
		.then(() => {
			this.emit('reward-sequence.items-complete');
			return this.outro.play();
		});
	},

	_playItems() {
		if (!this._rewardItems) {
			return Promise.reject(new Error('Attempting to play reward sequence before setting reward items'));
		}
		const itemNodes = _(this._rewardItems)
			.sortBy((rewardItem) => {
				return rewardItem.itemData && rewardItem.itemData.order;
			})
			.map('rewardNode')
			.value();
		return Promise.mapSeries(itemNodes, (itemNode, index, length) => {
			const sequenceItem = itemNode.getComponent(MissionRewardSequenceItem);
			// Setup the intro state for the reward to first frame to avoid flickering
			sequenceItem.sample();
			itemNode.opacity = 255;
			return sequenceItem.playItem()
			.then(() => {
				itemNode.opacity = 0;
				// Play transition animation if this is not the last item in the sequence
				if (index !== length - 1) {
					return this.transition.play();
				}
			});
		});
	},

	consolidateProductPackageRewards(rewardItems){
		//consolidate chips
		if(!!rewardItems[PRODUCT_PACKAGE_ITEM_CHIPS_TYPE]){
			let chipItem = {
				amount:0,
				order:0,
				productPackageType: "ProductPackageItemChips",
				promoData:{
					amount:0,
					name: "Chips"
				}
			};
			rewardItems[PRODUCT_PACKAGE_ITEM_CHIPS_TYPE].forEach(function(rewardItem){
				chipItem.amount += +rewardItem.amount;
				chipItem.promoData.amount += +rewardItem.promoData.amount
			});
			rewardItems[PRODUCT_PACKAGE_ITEM_CHIPS_TYPE] = [chipItem];
		}
		return rewardItems;
	},
});
