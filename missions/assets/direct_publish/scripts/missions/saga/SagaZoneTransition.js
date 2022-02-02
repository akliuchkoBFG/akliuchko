const TAG = "SagaZoneTransition";
const ComponentLog = require('ComponentSALog')(TAG);

const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
	'zoneTransition',
];

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Saga/Zone Transition',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	mixins: [ComponentLog],

	properties: {
		zoneRewardContainer: {
			default: null,
			type: cc.Node,
		},

		// Animation component for anim states. Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Animation component for zone transition choreography',
				'Adding this component will reveal states for zoneTransition',
			].join('\n')
		),

		// Animation states
		zoneTransition: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for transitioning between zones'
		),
	},

	setupForTransition(zoneRewardNode) {
		if (!this.zoneRewardContainer) {
			this.log.e("Zone reward container not configured");
			return;
		}
		if (this._zoneReward) {
			this._zoneReward.removeFromParent();
		}

		// Save reference to zone reward for reparenting at the appropriate moment in the sequence
		this._sourceZoneReward = zoneRewardNode;
		// Calculate position in the zone reward container
		const worldPosition = zoneRewardNode.convertToWorldSpaceAR(cc.p(0, 0));
		const localPosition = this.zoneRewardContainer.convertToNodeSpaceAR(worldPosition);
		this._rewardPosition = localPosition;
	},

	_reparentZoneReward() {
		const scrollAnim = this._sourceZoneReward.getComponent('ScrollViewContentAnimation');
		if (scrollAnim) {
			// Scroll animation no longer valid when being reparented outside the scroll view
			scrollAnim.destroy();
		}
		// Removes the node from the table view and prevents it from being recycled
		this._sourceZoneReward.parent = this.zoneRewardContainer;
		this._zoneReward = this._sourceZoneReward;
		this._zoneReward.setPosition(this._rewardPosition);
		this._sourceZoneReward = null;
		this._rewardController = this.zoneRewardContainer.getComponentInChildren('SagaStepZoneReward');
	},

	playSequence() {
		// Sample the first frame of the transition animation to make sure the transition overlay is now active
		this.zoneTransition.sample();
		// Reparent zone reward to transition overlay
		this._reparentZoneReward();

		return Promise.resolve()
		.then(() => {
			// Play step node choreography for transition
			if (this._rewardController) {
				return this._rewardController.playZoneTransition();
			}
		})
		.then(() => {
			// Play scene choreography for transition
			return this.zoneTransition.play();
		});
	},
});
