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
        this.boxDataUpdated = false;
        if (missionInterfaceComp) {
            missionInterfaceComp.on('updateMissionDataEvent', this.onUpdateStepData, this);
            this.updateIconInStepBox();
        }
    },

    onDisable: function() {
        this.boxUpdateNeeded = true;
    },

    update: function () {
        if (this.node.active && this.boxUpdateNeeded) {
            this.updateIconInStepBox();
        }
    },

    onUpdateStepData: function () {
        this.boxUpdateNeeded = true;
    }, 

    updateIconInStepBox: function() {
        this.currentStep = this.missionInterface.getStepData(this.stepId);
        if (this.currentStep) {
            this.updateStepStatus();
        }
    },

    updateStepStatus: function() {
        if (this.currentStep) {
            this.stepStatus = this.currentStep.data.state;
            this.stepDescriptionRaw = this.currentStep.data.formatString || '';
            this.stepMax = this.currentStep.data.max || null;
            this.stepSlotName = this.currentStep.class || '';
        }
        this.boxUpdateNeeded = false;
    },
});
