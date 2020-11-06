
cc.Class({
    extends: cc.Component,

    properties: {
        missionNode: {
            default: null,
            type: cc.Node,
        }
    },

    onLoad: function () {
        if (this.missionNode) {
            this.missionInfoStatusCtrl = this.missionNode.getComponent('MissionInfoStatusController');
        }
    },

    goToProgressPopup () {
        if (this.missionInfoStatusCtrl) {
            this.missionInfoStatusCtrl.goToProgressPopup();
        }
    },
    
    performSeeProgressAction: function() {
        this.goToProgressPopup();
    },
    
});
