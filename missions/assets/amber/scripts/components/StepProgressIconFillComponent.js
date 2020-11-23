const MissionStepInterface = require('MissionStepInterface');

cc.Class({
    extends: cc.Component,

    properties: {
        fillSprite: {
            default: null,
            type: cc.Sprite
        },
        fillRange: {
            default: 0
        },
        freezeProgress: {
            default: false,
        },
        mst: {
            default: null,
            type: MissionStepInterface,
            tooltip: 'Mission Step node',
        },
        currentStepBlockIndex: {
            default: 0,
            type: cc.Integer,
        },
    },

    onLoad: function () {
        const iconBlockComp = this.node.getComponent('MissionButtonIconController');
        this.includedSteps = iconBlockComp && iconBlockComp.stepsInGroup;

        this.missionStepInterface = this.mst;
        if (this.missionStepInterface) {
            this.missionStepInterface.on('updateMissionStepDataEvent', this.checkCurrentIconBlock, this);
            this.missionStepInterface.getComponent(cc.Animation).on('finished', this.onStepCompleteAnimation, this);
        }
    },
    
    update: function () {
        if (this.freezeProgress) {
            return;
        }
        if (this.isUpdate || this.isStepCompleteUpdate) {
            this.updateStepBlockIcon();
        }
    },

    onStepCompleteAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'step_complete') {
            this.isStepCompleteUpdate = true;
            this.postionConstant = 1;
        }
    },

    updateStepBlockIcon: function () {
        if (this.fillSprite) {
            let amount = this.currentRange || 0;
            if (this.includedSteps && !this.isNoProgress) {
                const numberOfIncludedSteps = this.includedSteps.length;
                const fillRangePortion = 1 / numberOfIncludedSteps;
                const stepIndex = this.isStepCompleteUpdate ? this.currentStep : this.currentStep;

                if (this.currentStep >= 0) {
                    let position = this.includedSteps.indexOf(stepIndex);
                    if (position !== -1) {
                        amount = (position + this.postionConstant) * fillRangePortion;
                    }
                }
            }
            this.fillSprite.fillRange = amount;
            this.isNoProgress = false;
            this.isUpdate = false;
            this.isStepCompleteUpdate = false;
        }
    },

    checkCurrentIconBlock: function() {
        this.isStepCompleteUpdate = false;
        this.postionConstant = 0;
        
        if (this.missionStepInterface) {
            this.isNoProgress = this.missionStepInterface.stepID == '0' && 
                this.missionStepInterface._stepData.data.progress == '0';
        }

        this.currentStep = this.missionStepInterface && this.missionStepInterface.stepID * 1;
        this.lastStepInBlock = this.includedSteps[this.includedSteps.length -1];
        const isFinalStepDone = this.isFinalStepAwarded();
        const isStepInBlock = this.includedSteps && (this.includedSteps.indexOf(this.currentStep) !== -1);

        if (isFinalStepDone || (this.currentStep > this.lastStepInBlock)) {
            this.currentRange = 1;
            this.isUpdate = true;
        }

        if (!isStepInBlock) {
            return;
        } else {
            this.isUpdate = true;
        }
    },

    isFinalStepAwarded: function() {
        if (this.missionStepInterface && !this.missionStepInterface.dependentSteps.length) {
            var missionSteps = this.missionStepInterface.missionInterface && this.missionStepInterface.missionInterface._stepData;
            const lastStep = missionSteps && missionSteps[Object.keys(missionSteps).length - 1];
            return lastStep.data && lastStep.data.awarded;
        }
        return false;
    }
});
