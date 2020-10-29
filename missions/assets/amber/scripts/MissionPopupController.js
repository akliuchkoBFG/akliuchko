const MissionInterface = require('MissionInterface');

const emptyNode = {
    default: null,
    visible: false,
    type: cc.Node
};

cc.Class({
    extends: cc.Component,
    properties: {
        targetChildNode: emptyNode,
        previousChildNode: emptyNode,
        popupOverlay: {
            default: null,
            type: cc.Node
        },
        missionInterface: {
            default: null,
            type: MissionInterface,
            tooltip: "Step Interfaces require a top level Mission Interface to access Mission and Step data"
        },
    },

    // use this for initialization
    onLoad: function () {
        if (CC_EDITOR) {
			this.missionInterface = this.missionInterface || MissionInterface.findInterfaceInScene(this);
        }
        if (this.missionInterface) {
            this.missionInterface.on('updateMissionDataEvent', this.setStepData, this);
        }
    },

    setStepData: function() {
        const stepData = this.missionInterface._stepData;
        // *TO DO
    },

    togglePopupWindow: function(jsonData) {
        if (jsonData) {
            let _jsonData = JSON.parse(jsonData);
            let currentPopupStatus = _jsonData.isNodeActive;
            // toggle the popup overlay.
            this.popupOverlay.active = currentPopupStatus === false;
            this.targetChildNode = this.node.getChildByName(_jsonData.name);
           
            // handle active popup if a new one is triggered.
            if (!currentPopupStatus && this.targetChildNode ) {
                if (this.previousChildNode && 
                    this.targetChildNode.name != this.previousChildNode.name) {
                    this.previousChildNode.active = false;
                }

                this.previousChildNode = this.targetChildNode;
            }

            this.targetChildNode.active = !currentPopupStatus;
        }
    }
});
