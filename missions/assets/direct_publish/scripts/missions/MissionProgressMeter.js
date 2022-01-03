const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: cc.Animation,
        menu: 'Add Mission Component/Mission Progress Meter',
        // executeInEditMode: true,
        // TODO: help: 'url/to/help/wikipage'
    },

    properties: {
        fillSprite: {
            default: null,
            type: cc.Sprite
        },
        fillRange: {
            default: 0
        },
        progressTransition: {
            default: 1,
            min: 0,
            max: 1,
            slider: true,
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

    _getStepStartPoint: function(stepID) {
        if (stepID > 0) {
            return this._getStepEndPoint(stepID - 1);
        }
        return 0;
    },

    _getStepEndPoint: function(stepID) {
        if (stepID >= this.stepEndPoints.length) {
            return 1;
        }
        return this.stepEndPoints[stepID];
    },

    update: function () {
        if (this.freezeProgress) {
            return;
        }
        
        const id = this.missionStepInterface.stepID;
        const start = this._getStepStartPoint(id);
        const range = this._getStepEndPoint(id) - start;
        const amount = start + Math.min(this.fillRange, 1.0) * range;

        if (this.fillSprite) {
            this.fillSprite.fillRange = amount;
        }
    },
});
