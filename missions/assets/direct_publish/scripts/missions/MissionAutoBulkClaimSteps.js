const BaseMissionComponent = require('BaseMissionComponent');
const MissionInterface = require('MissionInterface');

cc.Class({
    extends: BaseMissionComponent,

    editor: CC_EDITOR && {
        menu: 'Missions/Miscellaneous/Auto Step Claim All',
        executeInEditMode: false,
    },

    // use this for initialization
    onLoad: function () {
        //Prevent bulkClaimSteps from being called multiple times
        this.initialized = false;
    },

    onUpdateMissionData(){
        //The update to call bulkClaimSteps should only happen once after the first mission update
        if(!this.initialized){
            this.initialized = true;
            if(this.missionInterface){
                //Claim all steps if there are any to claim
                const claimableSteps = this.missionInterface.getAnyStepClaimable();
                if(claimableSteps.length > 0){
                    this.missionInterface.bulkClaimSteps();
                }
            }
        }
    }
});
