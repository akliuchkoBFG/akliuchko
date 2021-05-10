
// This view controller was created as a hackathon project to support a very generic sequential mission
// Its designed to support any number of sequential steps and very basic choreography

const BaseMissionStepComponent = require('BaseMissionStepComponent');
const NodeSelector = require('NodeSelector');
const MissionRewardSequence = require('MissionRewardSequence');
const AnimationPromise = require('AnimationPromise');


const TAG = "GenericSequentialMissionPopupVC";
const ComponentLog = require('ComponentSALog')(TAG);

const TransitionAnimation = cc.Class({
	name: "TransitionAnimation",
	properties: {
		node: {
			default: null,
			type: cc.Node,
		},
		clipName: {
			default: "",
		},
	}
});

cc.Class({
	extends: BaseMissionStepComponent,

	mixins: [ComponentLog],

	properties: {
		// foo: {
		//    default: null,      // The default value will be used only when the component attaching
		//                           to a node for the first time
		//    url: cc.Texture2D,  // optional, default is typeof default
		//    serializable: true, // optional, default is true
		//    visible: true,      // optional, default is true
		//    displayName: 'Foo', // optional
		//    readonly: false,    // optional, default is false
		// },
		// ...

		mainContainer: {
			default: null,
			type: cc.Node,
		},

		rewardContainer: {
			default: null,
			type: cc.Node,
		},

		finalContainer: {
			default: null,
			type: cc.Node,
		},

		ctaSelector: {
			default: null,
			type: NodeSelector,
		},

		rewardItemView: {
			default: null,
			type: MissionRewardSequence,
		},

		// TODO: add more?
		animsRewardIntro: {
			default: [],
			type: [TransitionAnimation],
		},
		animsRewardOutro: {
			default: [],
			type: [TransitionAnimation],
		},

		animsNextStepIntro: {
			default: [],
			type: [TransitionAnimation],
		},
	},

	// use this for initialization
	onLoad: function () {
		this._super();

		// on claim
		this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
	},

	onUpdateMissionStepData: function() {
		// just for monitoring
		// this.log.d("onUpdateMissionStepData");

		// may need to hold for choreography

		const progressMax = this.missionStepInterface.getProgressMax();
		const progressAmount = this.missionStepInterface.getProgressAmount();
		const isAllComplete = this.missionStepInterface.missionInterface.isAllStepsComplete();

		if (isAllComplete) {
			// complete state
			this._showFinalState();

		} else if (progressAmount < progressMax) {
			// normal state
			this._showNormalState();

		} else if (progressAmount === progressMax) {
			// claim state
			this._showClaimState();

		} // else intro (progress === 0)?

	},

	_showNormalState: function() {
		// toggle state containers

		this._activateContainer(this.mainContainer, true);
		this._activateContainer(this.rewardContainer, false);
		this._activateContainer(this.finalContainer, false);

		// play button
		this.ctaSelector.node.active = true;
		this.ctaSelector.selection = 0;
	},

	_showClaimState: function() {
		// toggle state containers
		this._activateContainer(this.mainContainer, true);
		this._activateContainer(this.rewardContainer, false);
		this._activateContainer(this.finalContainer, false);

		// claim button
		this.ctaSelector.node.active = true;
		this.ctaSelector.selection = 1;
	},

	// This is coupled with _showRewardState
	onClaimPress: function() {
		// hide the button
		this.ctaSelector.node.active = false;
	},

	onClaim: function() {
		this._activateContainer(this.rewardContainer, true);
		this._playTransitionAnimation(this.animsRewardIntro).then(() => {
			// TODO: loading view before the request returns (_showRewardState)?

			// toggle the containers
			this._activateContainer(this.mainContainer, false);
			this._showRewardState();
		});
	},

	_showRewardState: function() {
		// show the reward
		this.rewardItemView.playSequence().then(() => {
			// transition out
			return this._playTransitionAnimation(this.animsRewardOutro);
		}).then(() => {
			// trigger the next phase
			this.missionStepInterface.onStepComplete();

			// transition in
			return this._playTransitionAnimation(this.animsNextStepIntro);
		});
	},

	_showFinalState: function() {
		this._activateContainer(this.mainContainer, false);
		this._activateContainer(this.rewardContainer, false);

		this._activateContainer(this.finalContainer, true);
	},

	_playTransitionAnimation: function(anims) {
		const promises = [];
		anims.forEach((anim) => {
			const animComponent = anim.node.getComponent(cc.Animation);
			promises.push(AnimationPromise.play(animComponent, anim.clipName, 0));
		});
		return Promise.all(promises);
	},

	_activateContainer: function (container, activate) {
		// set active and opacity
		container.active = activate;
		if (!CC_EDITOR) {
			// changing the opacity is maddening in the editor
			container.opacity = activate ? 255 : 0;
		}
	}

	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});
