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
        includedSteps: {
            default: [],
            type: [cc.Integer],
            multiline: true,
            tooltip: 'Number of steps in mission block',
        },
        freezeProgress: {
            default: false,
        },
    },

    onLoad: function () {
        this.missionStepInterface.on('updateMissionStepDataEvent', this.isIconInCurrentStepBlock, this);
        this.missionStepInterface.getComponent(cc.Animation).on('finished', this.onStepClaimAnimation, this);
    },
    
    update: function () {
        if (this.freezeProgress) {
            return;
        }
        if (this.isUpdate) {
            this.updateStepBlockIcon();
        }
    },

    onStepClaimAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'step_claim') {
            this.isUpdate = true;
        }
    },

    updateStepBlockIcon: function () {
        let amount = 0;
        if (this.fillSprite) {
            const numberOfIncludedSteps = this.includedSteps.length;
            const fillRangePortion = 1 / numberOfIncludedSteps;
            if (this.prevStep) {
                let position = this.includedSteps.indexOf(this.prevStep * 1);
                if (position !== -1) {
                    amount = (position + 1) * fillRangePortion;
                }
            }
            this.fillSprite.fillRange = amount;
        }
        this.isUpdate = false;
    },

    isIconInCurrentStepBlock: function() {
        const currentStepNumber = this.missionStepInterface.stepID * 1;
        const lastStepInBlock = this.includedSteps[this.includedSteps.length -1];

        if (currentStepNumber > lastStepInBlock) {
            this.fillSprite.fillRange = 1;
        } else if (this.includedSteps && this.missionStepInterface.stepID) {
            this.prevStep = this.missionStepInterface.stepID * 1 - 1;
            if (this.includedSteps.indexOf(this.prevStep) !== -1) {
                this.fillSprite.fillRange = 0;
                this.isUpdate = true;
            }
        }
    }
});
