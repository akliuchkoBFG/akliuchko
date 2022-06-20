const MissionStepButton = require('MissionStepButton');

cc.Class({
    extends: MissionStepButton,

    editor: CC_EDITOR && {
        menu: 'Buttons/Missions/Step Claim All',
        requireComponent: cc.Button,
        executeInEditMode: true,
    },

    performMissionStepAction: function() {
        var button = this.getComponent(cc.Button);
        button.enabled = false;
        this.missionStepInterface.missionInterface.bulkClaimSteps();
    },
});
