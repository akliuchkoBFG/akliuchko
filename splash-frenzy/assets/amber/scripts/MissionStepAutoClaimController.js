const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: cc.Animation,
        menu: 'Add Mission Component/Step State Controller',
        executeInEditMode: true,
    },

    properties: {

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
        cc.log('EVENT in STEP: ', this.missionStepInterface.stepID)
        if (this.missionStepInterface && event.detail.name == 'step_complete') {
            // this.missionStepInterface.claimAward();
        }
	},
});
