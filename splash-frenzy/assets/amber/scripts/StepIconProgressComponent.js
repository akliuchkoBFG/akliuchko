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
    },

    updateStepBlockIcon: function (range) {
        let amount = range;
        if (this.fillSprite) {
            if (!range) {
                const numberOfIncludedSteps = this.includedSteps.length;
                const fillRangePortion = 1 / numberOfIncludedSteps;
                if (this.prevStep) {
                    let position = this.includedSteps.indexOf(this.prevStep * 1);
                    if (position !== -1) {
                        amount = (position + 1) * fillRangePortion;
                    }
                }
            }
    
            this.fillSprite.fillRange = amount;
        }
    },

    isIconInCurrentStepBlock: function() {
        const currentStepNumber = this.missionStepInterface.stepID * 1;
        const lastStepInBlock = this.includedSteps[this.includedSteps.length -1];

        if (currentStepNumber > lastStepInBlock) {
            this.updateStepBlockIcon(1);
        } else if (this.includedSteps && this.missionStepInterface.stepID) {
            this.prevStep = this.missionStepInterface.stepID * 1 - 1;
            if (this.includedSteps.indexOf(this.prevStep) !== -1) {
                this.updateStepBlockIcon(0);
            }
        }
    }
});
