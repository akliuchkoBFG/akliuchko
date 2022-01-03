const BaseMissionStepComponent = require('BaseMissionStepComponent');
const MissionStepRewardSequence = require('MissionStepRewardSequence');
const MissionStepUserSelectionSequence = require('MissionStepUserSelectionSequence');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: cc.Animation,
		menu: 'Add Mission Component/Step State Controller',
		executeInEditMode: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/508428588/Mission+Step+State+Controller',
	},

	properties: {
		introState: {
			default: '',
			tooltip: "cc.Anim clip name - this clip shows the state when: progress equals 0"
		},
		progressState: {
			default: '',
			tooltip: "cc.Anim clip name - this clip shows the state when: 0 < progress < max amount"
		},
		completeState: {
			default: '',
			tooltip: "cc.Anim clip name - this clip shows the state when: progress equals max amount"
		},
		selectionSequence: {
			default: null,
			type: MissionStepUserSelectionSequence,
			tooltip: "SelectionSequence for selecting different options before the claim sequence"
		},
		claimState: {
			default: '',
			tooltip: "cc.Anim clip name - this clip plays after the user clicks the 'claim' button\nIgnored if 'Claim Sequence' is defined"
		},
		claimSequence: {
			default: null,
			type: MissionStepRewardSequence,
			tooltip: "Claim sequence controller for supporting multiple rewards and rich claim choreography\nIf present, ignores 'Claim State' property",
		},
		claimedState: {
			default: '',
			tooltip: "(optional) cc.Anim clip name – this clip plays when entering a scene with a claimed step reward\nUnused on active step only missions",
		},
		outroState: {
			default: '',
			tooltip: "cc.Anim clip name - this clip shows the outro state of the step"
		},
		availableAnimations: {
			multiline: true,
			readOnly: true,
			tooltip: "The list of avaliable animations to plug into the state fields",
			get() { 
				const names = [];
				this.getComponent(cc.Animation).getClips().forEach((entry) => {
					if (entry) {
						names.push(entry._name);
					}
				});
				return names.join('\n');
			}
		}
	},

	onLoad: function () {
		this._super();
		this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
		this.getComponent(cc.Animation).on('finished', this.onAnimFinished, this);
	},

	onUpdateMissionStepData: function() {
		if (this._areAllStepsComplete() && !this.claimedState) {
			// If the mission is complete, let the MissionStateController final animations take over
			return;
		}

		const max = this.missionStepInterface.getProgressMax();
		const progress = this.missionStepInterface.getProgressAmount();
		if (progress === 0) {
			this._play(this.introState);
		} else if (progress >= max) {
			if (this.missionStepInterface.getAwarded() && this.claimedState) {
				this._play(this.claimedState);
			} else if (!CC_EDITOR && this.selectionSequence) {
				this._playUserSelectionSequence();
			} else {
				this._play(this.completeState);
			}
		} else {
			// TODO: Need checks for complete / claim states(?)
			this._play(this.progressState);
		}
	},

	onAnimFinished: function(event) {
		if (!event.detail || !event.detail.name) {
			return;
		}

		switch (event.detail.name) {
			case this.claimState:
				if (!this.claimSequence) {
					this.onClaimComplete();
				}
				break;
			case this.outroState:
				this.onOutroComplete();
				break;
		}
	},

	onClaim: function(event) {
		if (event && event.detail && event.detail.stepID != null) {
			const stepID = +event.detail.stepID;
			if (+this.missionStepInterface.stepID !== stepID) {
				return;
			}
		}
		if (this.claimSequence) {
			this.claimSequence.playSequence()
			.then(() => {
				this.onClaimComplete();
			});
		} else {
			this._play(this.claimState);
		}
	},

	onClaimComplete: function() {
		this._play(this.outroState);
	},

	onOutroComplete: function() {
		this.missionStepInterface.onStepComplete();
	},

	_play: function(anim) {
		const comp = this.getComponent(cc.Animation);
		comp.play(anim);
	},

	_playUserSelectionSequence() {
		// Don't restart the chain if we still have an active promise
		// 	This avoids the problem of this state getting hit multiple
		if (!this._selectionSequencePromise) {
			this._selectionSequencePromise = this.selectionSequence.playSequence().then(() => {
				this._selectionSequencePromise = null;
				// if claimAward is selected, the state controller will respond to onClaim
				if (!this.selectionSequence.claimAward) {
					// otherwise, move to the complete state
					this._play(this.completeState);
				}
			});
		}
	},

	_areAllStepsComplete: function() {
		return this.missionStepInterface &&
			this.missionStepInterface.missionInterface &&
			this.missionStepInterface.missionInterface.isAllStepsComplete();
	},

});
