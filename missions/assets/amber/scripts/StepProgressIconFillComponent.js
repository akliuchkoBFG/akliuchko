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
        freezeProgress: {
            default: false,
        },
    },

    onLoad: function () {
        const iconBlockComp = this.node.getComponent('MissionButtonIconController');

        this.includedSteps = iconBlockComp && iconBlockComp.stepsInGroup;
        this.missionStepInterface.on('updateMissionStepDataEvent', this.checkCurrentIconBlock, this);
        this.missionStepInterface.getComponent(cc.Animation).on('finished', this.onStepCompleteAnimation, this);
    },
    
    update: function () {
        if (this.freezeProgress) {
            return;
        }
        if (this.isStepCompleteUpdate || this.isNoProgress) {
            this.updateStepBlockIcon();
        }
    },

    onStepCompleteAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'step_complete') {
            this.isStepCompleteUpdate = true;
        }
    },

    updateStepBlockIcon: function () {
        if (this.fillSprite) {
            let amount = this.currentRange;
            if (this.currentSetOfSteps && !this.isNoProgress) {
                const numberOfIncludedSteps = this.currentSetOfSteps.length;
                const fillRangePortion = 1 / numberOfIncludedSteps;

                if (this.currentStep >= 0) {
                    let position = this.currentSetOfSteps.indexOf(this.currentStep * 1);
                    if (position !== -1) {
                        amount = (position + 1) * fillRangePortion;
                        this.freezeProgress = amount == 1;
                    }
                }
            }
            this.fillSprite.fillRange = amount;
            this.isNoProgress = false;
            this.isStepCompleteUpdate = false;
        }
    },

    checkCurrentIconBlock: function() {
        if (this.missionStepInterface) {
            this.isNoProgress = this.missionStepInterface.stepID == '0' && 
                this.missionStepInterface._stepData.data.progress == '0';
        }

        this.currentStep = this.missionStepInterface && this.missionStepInterface.stepID * 1;
        const lastStepInBlock = this.includedSteps[this.includedSteps.length -1];
        const isFinalStepDone = this.isFinalStepAwarded();
        const isStepInBlock = this.includedSteps && (this.includedSteps.indexOf(this.currentStep) !== -1);

        if (this.isNoProgress || isStepInBlock) {
            this.currentRange = 0;
            this.currentSetOfSteps = this.includedSteps;
        } else if (isFinalStepDone || (this.currentStep > lastStepInBlock)) {
            this.currentRange = 1;
            this.isStepCompleteUpdate = true;
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
