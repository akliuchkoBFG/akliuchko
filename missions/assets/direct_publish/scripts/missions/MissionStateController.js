const BaseMissionComponent = require('BaseMissionComponent');
// const MissionStepController = require('MissionStepController');
const MissionCompletionRewardSequence = require('MissionCompletionRewardSequence');


const TAG = "missionStateController";
const ComponentLog = require('ComponentSALog')(TAG);

// WIP NOTES //////////////////////////
//
// Currently this will play an anim state based on the "active step"
// ... currently demo'd in features/missions/sampleMissionStates
//
// TODOS //////////////////////////
//
// - needs event updating for when a step completes and and the data refreshes
// - theres an issue with refreshing a template where it continues to get old data (so you may need to hack until thats fixed)
// - only the basics were tested... and with hack data
// - check some of the TODO's in MissionInterface if things seem buggy
//
///////////////////////////////////


cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: cc.Animation,
		menu: 'Add Mission Component/Mission State Controller',
		// TODO: help: 'url/to/help/wikipage'
	},

	properties: {
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
		},
		stepStates: {
			default: [],
			type:[cc.String],
			tooltip: "cc.Anim clip names to animate/show/hide assets during for each mission step"
			// TODO: add some safety/logs around notifying if steps don't line up to data
		},
		completedMissionState: {
			default: "",
			tooltip: "cc.Anim clip name - this clip shows the state when: all steps are complete"
		},
		claimMissionAwardSequence: {
			default: null,
			type: MissionCompletionRewardSequence,
			tooltip: "Claim sequence controller for supporting multiple rewards and rich claim choreography",
		},
		finalMissionState: {
			default: "",
			tooltip: "cc.Anim clip name to animate/show/hide assets when the user is revisiting this popup after having played through the entire mission"
		},
	},

	onLoad: function() {
		this._super();
		this.missionInterface.node.on('nextStep', this.onNextStep, this);
		this.missionInterface.on('claimedMissionAward', this.onClaimMissionAward, this);
	},

	onNextStep: function() {
		this.playActiveSteps();
	},

	onUpdateMissionData: function() {
		this.playActiveSteps();
	},

	onClaimMissionAward: function() {
		// mission award has been awarded
		if (this.claimMissionAwardSequence) {
			this.claimMissionAwardSequence.playSequence()
			.then(() => {
				this._play(this.finalMissionState);
			});
		} else {
			this._play(this.finalMissionState);
		}
	},

	playActiveSteps: function() {
		const stepIDs = this.missionInterface.getActiveStepIDs();
		stepIDs.forEach((stepID) => {
			if (stepID < this.stepStates.length) {
				this._play(this.stepStates[stepID]);
			} else {
				this.log.w('stepID:' + stepID + ' not defined... even if unused, the the step should be defined when using this controller');
			}
		});

		if (stepIDs.length === 0) {
			if (this.missionInterface.isAllStepsComplete()) {
				if (this.missionInterface.isMissionAwardClaimed()) {
					this._play(this.finalMissionState);
				} else {
					this._play(this.completedMissionState);
				}
			}
		}
	},

	_play: function(anim) {
		if (anim !== '') {
			const comp = this.getComponent(cc.Animation);
			comp.play(anim);
		}
	}
});
