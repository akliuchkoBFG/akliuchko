

const TAG = "MissionStepUserSelectionSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionStepComponent = require('BaseMissionStepComponent');

// const SpinePromise = require('SpinePromise');

const AnimationClipProperty = require('AnimationClipProperty');
const ANIM_COMPONENT_PROPERTY = 'animation';

cc.Class({
	extends: BaseMissionStepComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/User Selection/User Selection Sequence',
	},

	properties: {
		submitButton: {
			type: cc.Button,
			default: null,
			tooltip: "Submit button action will be disable prior to player selection"
		},

		prefabTargetNode: {
			type: cc.Node,
			default: null,
			tooltip: "Container that item prefabs are added to"
		},

		selectorPrefabs: {
			type: [cc.Prefab],
			default: [],
			tooltip: "Selection is per step ID"
		},

		selectionSpineFX: {
			default: null,
			type: sp.Skeleton,
			tooltip: "Spine effect to play whe making selections"
		},

		claimAward: {
			default: true,
			tooltip: "Advance directly to the reward claiming sequence on submit (rather than a seperate user action)"
		},

		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			[
				'intro',
				'outro',
			],
			[
				'Intro animation to the selector sequence',
				'Outro animation to the selector sequence',
			].join('\n')
		),

		intro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Intro animation to the selector sequence'
		),

		outro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Outro animation to the selector sequence'
		),
	},

	ctor: function() {
		// selector prefab loaded for this step
		this._activeSelector = null;
	},

	// use this for initialization
	onLoad: function () {
		this._super();

		let canLoad = true;
		// promise resolver for completion
		if (!this.prefabTargetNode) {
			this.log.e("Target Prefab Node Required but not set");
			canLoad = false;
		}

		if (!this.submitButton) {
			this.log.e("Submit Button Required but not set");
			canLoad = false;
		}

		if (!canLoad) {
			return;
		}
		this.submitButton.interactable = false;	// ensure that we cannot interact with the button until a selection is made
		this._completionResolver = null;
		this._userMadeSelection = false;

		this.missionStepInterface.missionInterface.on('publicCommandDataUpdated', (event) => {
			this._selectionMade();
		});
	},

	onUpdateStepMissionData: function() {

	},

	_selectionMade: function () {
		this._userMadeSelection = true;
		this.submitButton.interactable = true;

		if (this.selectionSpineFX) {
			this.selectionSpineFX.node.active = true;
			// SpinePromise.play(this.selectionSpineFX, this.selectionSpineFX.defaultAnimation);
			this.selectionSpineFX.setAnimation(0, this.selectionSpineFX.defaultAnimation, false);
		}
	},

	onCommitSelection: function() {
		if (!this._activeSelector) {
			this.log.e("No ActiveSelector set");
			return;
		} 

		if (!this._userMadeSelection) {
			// No selection was made yet
			return;
		}

		const missionInterface = this.missionStepInterface.missionInterface;
		const publicData = missionInterface.getPublicCommandData();
		missionInterface.sendPublicCommandData(publicData);

		// send tracking info
		this._sendMetricsEvent(publicData);

		// play the outro
		this.outro.play().then(() => {
			// end the sequence
			this._completionPromise = null;
			if (this.claimAward) {
				this.missionStepInterface.claimAward();
			}

			this._completionResolver();
		});
	},

	playSequence: function() {
		if (!CC_EDITOR && !this._completionPromise) {

			this._instantiateSelector();
			this.intro.play();

			this._completionPromise = new Promise((resolve) => {
				this._completionResolver = resolve;
			});
		}

		return this._completionPromise;
	},

	_instantiateSelector: function _instantiateSelector() {

		// get stepID
		const stepID = this.missionStepInterface.stepID;
		const itemsPrefab = this.selectorPrefabs[stepID] || this.selectorPrefabs[0];

		if (this.prefabTargetNode) {
			// remove instantiated nodes if any
			const prevSelector = this.getComponentInChildren("MissionUserSelection");
			if (prevSelector) {
				this.prefabTargetNode.removeChild(prevSelector.node);
			}

			// instantiate this steps selector
			var instance = cc.instantiate(itemsPrefab);
			this.prefabTargetNode.addChild(instance);

			this._activeSelector = instance.getComponent("MissionUserSelection");
			if (!this._activeSelector) {
				this.log.e("No Selector Component in prefab");
			}
		} else {
			this.log.e("No prefab target node found");
		}
	},

	_sendMetricsEvent: function(publicData) {
		if (this.missionStepInterface && this.missionStepInterface.missionInterface) {
			const data = {
				stepID: this.missionStepInterface.stepID,
				selectionData: publicData,
			};
			this.missionStepInterface.missionInterface.sendMetricsEvent('step_user_selection', data);
		}
	},

});
