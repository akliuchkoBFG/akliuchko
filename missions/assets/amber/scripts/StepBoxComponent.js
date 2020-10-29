const MissionInterface = require('MissionInterface');

cc.Class({
    extends: cc.Component,

    properties: {
        stepId: {
            default: 0,
            type: cc.Integer,
        },
        missionInterface: {
			default: null,
            type: MissionInterface,
        },
        currentStep: {
            default: null,
            visible: false,
        },
        stepStatus: {
            default: 'locked',
            visible: false,  
        },
    },

    onLoad: function () {
        const missionInterfaceComp = this.missionInterface;
        if (missionInterfaceComp) {
            this.currentStep = missionInterfaceComp.getStepData(this.stepId);
            this.updateStepStatus()
        }
    },

    updateStepStatus: function() {
        if (this.currentStep) {
            this.stepStatus = this.currentStep.data.state;
            this.stepDescriptionRaw = this.currentStep.data.formatString || '';
            this.stepMax = this.currentStep.data.max || null;
            this.stepSlotName = this.currentStep.class || '';
        }
    },
});
