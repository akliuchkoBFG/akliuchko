const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,
    properties: {
        fillSprite: {
            default: null,
            type: cc.Sprite
        },
        fillRange: {
            default: 0
        },
        stepEndPoints: {
            default: [],
            type: [cc.Float],
            multiline: true,
        },
        freezeProgress: {
            default: false,
        },
    },

    onLoad: function () {
        this.autoClaimCtrlComp = this.node.getComponent('MissionStepAutoClaimController');
        this.milestoneSteps = this.autoClaimCtrlComp && this.autoClaimCtrlComp.milestoneSteps;

        this.missionStepInterface.on('updateMissionStepDataEvent', this.onUpdateStep, this);
        this.missionStepInterface.getComponent(cc.Animation).on('finished', this.onStepCompleteAnimation, this);
    },
    
    update: function () {
        if (this.freezeProgress) {
            return;
        }
        if (this.isUpdate) {
            this.updateProgressFillBar();
        }
    },

    onUpdateStep: function () {
        this.stepID = this.missionStepInterface && this.missionStepInterface.stepID * 1;
        this.setStepRangePoint();
    },

    onStepCompleteAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'step_complete') {
            // advance on next step for fillbar;
            
            this.lastStep = this.milestoneSteps[this.milestoneSteps.length - 1];
            const isLastStep = this.lastStep == this.stepID;
            this.stepID = isLastStep ? this.missionStepInterface.stepID * 1 : this.missionStepInterface.stepID * 1 + 1;
            this.setStepRangePoint();
        }
    },

    getStepRangePoint: function () {
        return this.targetRange;
    },

    setStepRangePoint: function(e) {
        let rangeValue;
        switch (this.stepID) {
            case 1:
            case 2:
                rangeValue = this.stepEndPoints[0];
                break;
            case 3:
            case 4:
            case 5:
                rangeValue = this.stepEndPoints[1];
                break;
            case 6:
            case 7:
            case 8:
            case 9:
                rangeValue = this.stepEndPoints[2];
                break; 
            case 10:
            case 11:
            case 12:
            case 13:
                rangeValue = this.stepEndPoints[3];
                break; 
            default:
                rangeValue = 0;
                break;
        }
        this.targetRange = rangeValue;
        this.isUpdate = true;
    },

    updateProgressFillBar: function (id) {
        if (this.freezeProgress) {
            return;
        }
        const range = this.getStepRangePoint();

        if (this.fillSprite) {
            this.fillSprite.fillRange = range;
        }
        this.isUpdate = false;
    },
});
