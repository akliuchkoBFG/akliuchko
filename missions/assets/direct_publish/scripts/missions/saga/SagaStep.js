const TAG = 'SagaStep';
const ComponentLog = require('ComponentSALog')(TAG);
const SagaStepBase = require('SagaStepBase');
const SpineStateProperty = require('SpineStateProperty');
const SpinePromise = require('SpinePromise');
const AnimationClipProperty = require('AnimationClipProperty');


const SAGA_STEP_STATE = cc.Enum({
	Locked: 0,
	Unlocked: 1,
	Claimable: 2,
	Claimed: 3
});

const SPINE_STATE_NAMES = [
	'claimable',
	'claimable_to_claimed',
	'claimed',
	'locked',
	'locked_to_unlocked'
];

const ANIM_CLIP_NAMES = [
	'onStepClaim',
	'onStepActive',
	'beforeStepUnlocked',
	'onEnterClaimableState'
];

const ANIM_COMPONENT_PROPERTY = 'animation';
const SKELETON_COMPONENT_PROP = 'pillarSkeleton';

/*
 * SagaStep will stand in place of StepStateController for the Saga map
 * Each "pillar" step will have it's own instance of SagaStep.
 */
cc.Class({
	extends: SagaStepBase,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Saga/Step – Normal',
		executeInEditMode: false,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		pillarSkeleton: SpineStateProperty.spSkeletonForProperties(
			SKELETON_COMPONENT_PROP,
			SPINE_STATE_NAMES,
			[
				'Skeleton component for board game randomizer state animations',
				'Adding this component will reveal states for intro, loop, and outro',
			].join('\n')
		),
		claimable: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for when mission step is claimable',
			'claimable'
		),
		claimable_to_claimed: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for when mission step is transitioning from claimable to claimed',
			'claimable_to_claimed'
		),
		claimed: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for when mission step has been claimed',
			'claimed'
		),
		locked: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for when mission step is locked',
			'locked'
		),
		locked_to_unlocked: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for when mission step is transitioning from locked to unlocked',
			'locked_to_unlocked'
		),

		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Required animation for turning banner nodes on and off with mission progress',
			].join('\n')
		),

		onStepClaim: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'On step claim'
		),

		onStepActive: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'On step entering in progress state'
		),

		beforeStepUnlocked: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Plays on initialization before step is unlocked'
		),

		onEnterClaimableState: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'When entering claimable state'
		),

		bookendNode: {
			default: null,
			type: cc.Node,
			tooltip: "A bookend node is a container that conditionally shows extra context for the first step of a zone after a zone transition",
		},
	},

	__preload:SpineStateProperty.createPreloadFunction(SPINE_STATE_NAMES),

	// use this for initialization
	onLoad() {
		this._super();
		this._isInitialized = false;
	},

	onUpdateMissionStepData() {
		// Initialize if this is the first mission step data update we have gotten
		if(!this._isInitialized){
			this._isInitialized = true;
			this._initialize();
			return;
		}
		if(this._stepState === SAGA_STEP_STATE.Unlocked){
			if(this._stepProgress !== this.missionStepInterface.getProgressAmount()){
				this._accumulateProgress();
				// If our new progress amount is the max amount, we are transition to the claimable state now
				if(this._stepProgress === this.missionStepInterface.getProgressMax()){
					this._setupClaimableState();
				}
			}
		}
	},

	/*
	 * Go back to initial locked state
	 */
	resetToLocked() {
		this._stepState = SAGA_STEP_STATE.Locked;
		this._stepProgress = 0;
		const animOpts = {
			setToSetupPose: true,
		};
		this.locked.play(animOpts);
		this.beforeStepUnlocked.play();
		this.emit('saga-step.reset-to-locked');
	},

	claimPressed() {
		if (this._stepState === SAGA_STEP_STATE.Claimable) {
			this.emit('saga-step.claim-pressed');
		}
	},

	onRewardSequenceIntroComplete() {
		// Setup the transition while the node is off screen
		this.claimable_to_claimed.sample();
		this.onStepClaim.sample();
	},

	/*
	 * Check if we are in a claimable state and if so transition into the final
	 * claimed state playing all necessary animations
	 */
	onClaimAction() {
		const animOpts = {
			setToSetupPose: true,
		};
		if(this._stepState === SAGA_STEP_STATE.Claimable) {
			this._stepState = SAGA_STEP_STATE.Claimed;
			this.finishedClaimable = true;
			this.claimablePromise.cancel();
			const animPromise = this.claimable_to_claimed.play(animOpts)
			.then(() => {
				return this.claimed.play(animOpts);
			});
			this.onStepClaim.play();
			return animPromise;
		} else {
			return Promise.reject("Invalid state in onClaimAction: " + this._stepState);
		}
	},

	/*
	 * Play the unlock animation and get state ready to show progress accumulation
	 * Any progress meter initialization that needs to be done will happen here
	 */
	doUnlock() {
		// We are going from locked to unlocked, play the animation.
		if(this._stepState === SAGA_STEP_STATE.Locked) {
			const activeStepIDs = this.missionStepInterface.missionInterface.getActiveStepIDs();
			const isStepActive = activeStepIDs.indexOf(this.missionStepInterface.stepID.toString()) !== -1;

			const animOpts = {
				setToSetupPose: true,
			};
			if(isStepActive) {
				const animPromise = this.locked_to_unlocked.play(animOpts)
				.then(() => {
					this.emit('saga-step.unlocked');
				});
				this._stepProgress = 0;
				// Now we are unlocked
				this._setupUnlockedState();
				return animPromise;
			}
			
		}
		return Promise.reject("Invalid state in doUnlock: " + this._stepState);
	},

	/*
	 * Anything that needs to happen while in unlocked state when we get updated
	 * mission step data.
	 */
	_accumulateProgress() {
		// Set new step progress
		this._stepProgress = this.missionStepInterface.getProgressAmount();
	},

	_setupUnlockedState(){
		this._stepState = SAGA_STEP_STATE.Unlocked;
		this.onStepActive.play();
	},

	/*
	 * Enter the claimable state and start claimable animation loop
	 */
	_setupClaimableState() {
		this._stepState = SAGA_STEP_STATE.Claimable;
		const animOpts = {
			setToSetupPose: true,
		};

		this.finishedClaimable = false;
		this.claimablePromise = this.claimable.loopUntil(() => {
			return this.finishedClaimable;
		}, animOpts)
		.catch(SpinePromise.AnimationStopped, () => {
			// Intentionally empty, claimable will be interrupted by the claim animation
		});
		this.onEnterClaimableState.play();
	},

	_isZoneTransitionStart() {
		// Was this node the first node after a zone transition?
		const stepInterface = this.missionStepInterface;
		const previousStep = stepInterface.predecessorSteps[0];
		if (previousStep == null) {
			// No previous steps, this step starts the mission not a new zone
			return false;
		}
		const previousStepData = stepInterface.missionInterface.getStepData(previousStep);
		if (!previousStepData) {
			// Something went wrong fetching step data for a step that should definitely be in the mission
			this.log.e("Mission step data missing for stepID: " + previousStep);
			return false;
		}
		return previousStepData.class === 'MissionStepAwardOnly';
	},

	/*
	 * Look at missionStepInterface to figure out what state we are starting from.
	 */
	_initialize() {
		const isAwarded = this.missionStepInterface.getAwarded();
		const activeStepIDs = this.missionStepInterface.missionInterface.getActiveStepIDs();
		const isStepActive = activeStepIDs.indexOf(this.missionStepInterface.stepID) !== -1;
		const stepComplete = this.missionStepInterface.getProgressAmount() === this.missionStepInterface.getProgressMax();

		const animOpts = {
			setToSetupPose: true,
		};

		if(!isAwarded && !isStepActive){
			this.resetToLocked();
		} else if(isAwarded && !isStepActive) {
			this._stepState = SAGA_STEP_STATE.Claimed;
			this.claimed.play(animOpts);
			this.onStepClaim.play();
		} else if(!isAwarded && !stepComplete){
			this._setupUnlockedState();
			// Make sure the node ui is hidden for the active state
			this.pillarSkeleton.clearTracks();
			this._accumulateProgress();
		} else if(!isAwarded && stepComplete) {
			this._setupClaimableState();
		}

		if (this.bookendNode) {
			this.bookendNode.active = this._isZoneTransitionStart();
		}
	},
});
