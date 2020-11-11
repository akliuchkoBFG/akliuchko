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
        this.updateOnComplete = false;
        this.targetRange = this.getStepRangePoint(this.stepID);
    },

    onStepCompleteAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'step_complete') {
            this.updateOnComplete = true;
            
            // advance on next step for fillbar;
            this.lastStep = this.milestoneSteps[this.milestoneSteps.length - 1];
            const isLastStep = this.lastStep == this.stepID;
            this.stepID = isLastStep ? this.missionStepInterface.stepID * 1 : this.missionStepInterface.stepID * 1 + 1;
            this.targetRange = this.getStepRangePoint(this.stepID);
        }
    },

    getStepRangePoint: function(currentStep, isPrevStepNeeded) {
        let rangeValue;
        const actionStep = isPrevStepNeeded ? currentStep - 1 : currentStep;

        switch (actionStep) {
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

        if (!isPrevStepNeeded) {
            this.isUpdate = true;
        }

        return rangeValue;
    },

    _getStepStartPoint: function(stepID) {
        const prevStepNeeded = true;
        if (stepID > 0) {
            return this.getStepRangePoint(stepID, prevStepNeeded);
        }
        return 0;
    },

    updateProgressFillBar: function () {

        if (this.freezeProgress) {
            return;
        }

        const start = this._getStepStartPoint(this.stepID);
        const range = this.getStepRangePoint(this.stepID);

        if (start != range && this.updateOnComplete) {
            this.missionStepInterface.getComponent(cc.Animation).play('fill_bar');
        }

        const amount = start == range || !this.updateOnComplete ? 
            range : start + Math.min(this.fillSprite.fillRange - start, 1.0) + 0.01;

        if (this.fillSprite) {
            this.fillSprite.fillRange = amount;
        }
        
        if (amount >= range) {
            this.isUpdate = false;
        }
    },
});
