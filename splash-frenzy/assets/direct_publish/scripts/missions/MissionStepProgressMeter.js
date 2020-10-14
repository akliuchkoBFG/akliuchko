const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Step Progress Meter',
        executeInEditMode: true,
        // TODO: help: 'url/to/help/wikipage'
    },

    properties: {
        fillSprite: {
            default: null,
            type: cc.Sprite
        },
    },

    onUpdateMissionStepData: function() {
        const progress = this.missionStepInterface.getProgressAmount() || 0;
        const max = this.missionStepInterface.getProgressMax() || 1;
        if (this.fillSprite) {
            this.fillSprite.fillRange = progress / max;
        }
    },
});
