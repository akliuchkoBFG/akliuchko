const TAG = "MissionRewardSequenceItem";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionPremiumItemView = require('MissionPremiumItemView');
const AnimationClipProperty = require('AnimationClipProperty');
const MissionRewardFilter = require('MissionRewardFilter');
const MissionRewardFilterIsPremiumItem = require('MissionRewardFilterIsPremiumItem');

const ANIM_COMPONENT_PROPERTY = 'animation';

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Sequence/Sequence Item',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		premiumItem: {
			default: null,
			type: MissionPremiumItemView,
			notify() {
				if (
					CC_EDITOR
					&& this.premiumItem
					&& !this.getComponent(MissionRewardFilterIsPremiumItem)
				) {
					Editor.log("Automatically adding reward filter to only accept rewards that are premium items");
					this.addComponent(MissionRewardFilterIsPremiumItem);
				}
			}
		},

		// Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			[
				'intro',
				'outro',
			],
			[
				'Animation component for overall reward sequence animation states (optional)',
				'Adding this component will reveal states for intro and optional outro',
			].join('\n')
		),

		intro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation clip to start reward choreography.\nThis clip can cover the entire sequence if a separate outro is not desired'
		),

		outro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'(optional) Animation clip to end reward choreography. Can be omitted if the intro clip covers the desired sequence'
		),
	},

	loadItem() {
		return this._loadingPromise || Promise.resolve();
	},

	supportsItem(itemData, premiumItemModel) {
		const filters = this.getComponents(MissionRewardFilter);
		for (const filter of filters) {
			if (!filter.supportsItem(itemData, premiumItemModel)) {
				return false;
			}
		}
		return true;
	},

	setReward(itemData, premiumItemModel) {
		this._itemData = itemData;
		this._itemModel = premiumItemModel;
		// Start preloading premium item client config/bundle
		if (this.premiumItem && this._itemModel instanceof PremiumItemModel) {
			this._loadingPromise = this.premiumItem.setItemModel(this._itemModel);
		}
	},

	playItem() {
		return this.loadItem()
		.then(() => {
			return this.intro.play();
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
