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
            missionInterfaceComp.on('updateMissionDataEvent', this.updateIconInStepBox, this);
            this.updateIconInStepBox();
            cc.log(1);
        }
    },

    updateIconInStepBox: function() {
        cc.log(2);
        this.currentStep = this.missionInterface.getStepData(this.stepId);
        this.updateStepStatus();
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
