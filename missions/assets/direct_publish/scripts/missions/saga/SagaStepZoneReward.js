const TAG = 'SagaStepZoneReward';
const ComponentLog = require('ComponentSALog')(TAG);

const SagaStepBase = require('SagaStepBase');
const AnimationClipProperty = require('AnimationClipProperty');
const SpineStateProperty = require('SpineStateProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
	'claimable',
	'claim',
	'locked',
];

const ZONE_REWARD_SKELETON = 'zoneReward';
const ZONE_REWARD_STATES = [
	'zoneRewardIdle',
	'zoneRewardClaim',
];

const ZONE_TRANSITION_SKELETON = 'zoneTransition';
const ZONE_TRANSITION_STATES = [
	'zoneTransitionIntro',
	'zoneTransitionLoop',
];

// Saga step controller for a zone reward used for the AwardOnly step type at the end of each zone
cc.Class({
	extends: SagaStepBase,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Saga/Step – Zone Reward',
		executeInEditMode: false,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		// Animation component for anim states. Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Animation component for mission and step animation choreography',
				'Adding this component will reveal states for stepComplete, stepClaim, stepOutro, and missionComplete',
			].join('\n')
		),

		// Animation states
		claimable: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for when a zone reward is claimable'
		),
		claim: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state to play alongside the spine claim animation'
		),
		locked: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for when a zone reward is locked'
		),

		// Spine animation for reward claim
		zoneReward: SpineStateProperty.spSkeletonForProperties(
			ZONE_REWARD_SKELETON,
			ZONE_REWARD_STATES,
			[
				'Skeleton component for the reward idol that dispenses the zone reward item(s)',
				'Adding this component will reveal states for idle, and claim',
			].join('\n')
		),

		// Spine animation states
		zoneRewardIdle: SpineStateProperty.propertyDefinition(
			ZONE_REWARD_SKELETON,
			'Animation state for when idol is idle',
			'Idle'
		),
		zoneRewardClaim: SpineStateProperty.propertyDefinition(
			ZONE_REWARD_SKELETON,
			[
				'Animation state for when idol should open to give out rewards',
				'Supports having a "_reveal" spine event for reward timing',
			].join('\n'),
			'Claim'
		),

		// Spine animation for zone transition
		zoneTransition: SpineStateProperty.spSkeletonForProperties(
			ZONE_TRANSITION_SKELETON,
			ZONE_TRANSITION_STATES,
			[
				'Skeleton component for the step node portion of the transition animation (i.e. a ladder dropping down)',
				'Adding this component will reveal states for Transition Intro and Transition Loop',
			].join('\n')
		),

		// Spine animation states
		zoneTransitionIntro: SpineStateProperty.propertyDefinition(
			ZONE_TRANSITION_SKELETON,
			'Animation state for starting a zone transition',
			'Transition Intro'
		),
		zoneTransitionLoop: SpineStateProperty.propertyDefinition(
			ZONE_TRANSITION_SKELETON,
			[
				'Animation state for when idol should open to give out rewards',
				'Supports having a "_reveal" spine event for reward timing',
			].join('\n'),
			'Transition Loop'
		),

		bookendNode: {
			default: null,
			type: cc.Node,
			tooltip: "A bookend node is a container that conditionally shows extra context hinting at the next zone if there is one",
		},
	},

	__preload() {
		SpineStateProperty.createPreloadFunction(ZONE_REWARD_STATES).call(this);
		SpineStateProperty.createPreloadFunction(ZONE_TRANSITION_STATES).call(this);
	},

	onLoad() {
		this._super();
		this._isInitialized = false;
	},

	onUpdateMissionStepData() {
		// Initialize if this is the first mission step data update we have gotten
		if (!this._isInitialized) {
			this._isInitialized = true;
			this._initialize();
			return;
		}
	},

	// Setup the step to initial state
	_initialize() {
		const isClaimable = this.missionStepInterface.getState() === 'complete';

		if (isClaimable) {
			this._setupClaimableState();
		} else {
			// Zone reward should only be visible if it is claimable or locked, assume locked here
			this._setupLockedState();
		}
	},

	_setupClaimableState() {
		this.claimable.play();
		if (this.bookendNode) {
			// Bookend node should not show during zone transition so hide it as soon as the reward is claimable
			this.bookendNode.active = false;
		}
	},

	_setupLockedState() {
		this.locked.play();
		if (this.bookendNode) {
			// Show bookend node if there is another zone after this step
			this.bookendNode.active = this.missionStepInterface.dependentSteps.length > 0;
		}
	},

	claimPressed() {
		if (this.missionStepInterface.getState() === 'complete') {
			this.emit('saga-step.claim-pressed');
			this.claim.play();
		}
	},

	// After claim request completes play the claim spine animation
	// Resolves from the '_reveal' spine event or the animation completes, whichever comes first
	onClaimAction() {
		const claimAnim = this.zoneRewardClaim.play();
		const revealEvent = new Promise((resolve) => {
			if (this.zoneReward) {
				this.zoneReward.setEventListener((track, event) => {
					if (event && event.data && event.data.name === '_reveal') {
						resolve();
					}
				});
			}
		});
		return Promise.any([claimAnim, revealEvent])
		.finally(() => {
			if (this.zoneReward) {
				// Clear event listener after this completes
				this.zoneReward.setEventListener(null);
			}
		});
	},

	// Transition to claimable, zone rewards are always award only steps
	doUnlock() {
		this._setupClaimableState();
		return Promise.resolve();
	},

	resetToLocked() {
		// Zone rewards should not need to reset their lock state
		// Intentionally does nothing
		this.log.d("Unexpected call to SagaStepZoneReward.resetToLocked");
	},

	// Play node effects for zone transition sequence
	playZoneTransition() {
		return this.zoneTransitionIntro.play()
		.then(() => {
			// Intentionally doesn't return the promise, it loops indefinitely
			this.zoneTransitionLoop.loopUntil(() => { return false; });
			return null;
		});
	},
});
