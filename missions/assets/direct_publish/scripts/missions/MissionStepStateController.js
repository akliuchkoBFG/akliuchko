const BaseMissionStepComponent = require('BaseMissionStepComponent');
const MissionStepRewardSequence = require('MissionStepRewardSequence');

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
		claimState: {
			default: '',
			tooltip: "cc.Anim clip name - this clip plays after the user clicks the 'claim' button\nIgnored if 'Claim Sequence' is defined"
		},
		claimSequence: {
			default: null,
			type: MissionStepRewardSequence,
			tooltip: "Claim sequence controller for supporting multiple rewards and rich claim choreography\nIf present, ignores 'Claim State' property",
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
		if (this._areAllStepsComplete()) {
			// If the mission is complete, let the MissionStateController final animations take over
			return;
		}

		const max = this.missionStepInterface.getProgressMax();
		const progress = this.missionStepInterface.getProgressAmount();
		if (progress === 0) {
			this._play(this.introState);
		} else if (progress >= max) {
			this._play(this.completeState);
		} else {
			// TODO: Need checks for complete / claim states(?)
			this._play(this.progressState);
		}
	},

	onAnimFinished: function(event) {
		if (!event.detail || !event.detail.name) {
			return;
		}

		cc.log('STEP STATE Finished:', event.detail.name);

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

	onClaim: function() {
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
		cc.log('STEP', anim);
	},

	_areAllStepsComplete: function() {
		return this.missionStepInterface &&
			   this.missionStepInterface.missionInterface &&
			   this.missionStepInterface.missionInterface.isAllStepsComplete();
	},

});
