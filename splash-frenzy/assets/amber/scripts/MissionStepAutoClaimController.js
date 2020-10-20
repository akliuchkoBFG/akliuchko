const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: cc.Animation,
        menu: 'Add Mission Component/Step State Controller',
        executeInEditMode: true,
    },

    properties: {
        milestoneSteps: {
            default: [],
            type: [cc.Integer],
            multiline: true,
            tooltip: 'Steps that contain a special reward item',
        },
    },

	onLoad: function () {
		this._super();
        this.getComponent(cc.Animation).on('finished', this.onCompleteStepAnimFinished, this);
	},

    // Trigger Claim method after the completed animation is successful. 
    onCompleteStepAnimFinished: function(event) {
		if (!event.detail || !event.detail.name) {
			return;
        }
        const stepID = this.missionStepInterface.stepID;
        const eventName = event.detail.name.toString();

        // TODO refactor this;
        if (this.missionStepInterface) {
            const isMilestoneStep =  this.milestoneSteps.indexOf(stepID * 1) !== -1;
            const isMilestoneStepEventFinished = eventName.includes('step_milestone');
            if (event.detail.name == 'step_complete' && isMilestoneStep) {
                cc.log('step_complete', 'isMilestoneStep:', isMilestoneStep);
                this.playMilestoneStepAnimation(stepID);
            } else if (event.detail.name == 'step_complete' || isMilestoneStepEventFinished) {
                cc.log('DEFAULT CALAIM', isMilestoneStep);
                this.missionStepInterface.claimAward();
            }
        } 
    },

    playMilestoneStepAnimation(step) {
        const comp = this.getComponent(cc.Animation);
        const milestoneName = 'step_milestone_'.concat(step);

        if (milestoneName && comp) {
            comp.play(milestoneName)
        }
    }
});
