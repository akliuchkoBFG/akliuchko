const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: cc.Animation,
		menu: 'Add Mission Component/Step State Controller',
		executeInEditMode: true,
		// TODO: help: 'url/to/help/wikipage'
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
			tooltip: "cc.Anim clip name - this clip plays after the user clicks the 'claim' button"
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

		switch (event.detail.name) {
			case this.claimState:
				this.onClaimComplete();
				break;
			case this.outroState:
				this.onOutroComplete();
				break;
		}
	},

	onClaim: function() {
		this._play(this.claimState);
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

});
