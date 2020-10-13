const MissionInterface = require('MissionInterface');

cc.Class({
    extends: cc.Component,

    properties: {
        iconDefault: {
            default: null,
            type: cc.SpriteFrame
        },
        iconCompleted: {
            default: null,
            type: cc.SpriteFrame
        },
        linkedNode:{
            default: null,
            type: cc.Node
        },
        popupEventHandler: {
            default: null,
            type: cc.Component.EventHandler
        },
        missionInterface: {
			default: null,
            type: MissionInterface,
        },
        stepsInGroup: {
            default: [],
            type: cc.Float,
            tooltip: 'Number of mission steps included in this misson group',
        },
    },

    onLoad: function () {
        const missionInterfaceComp = this.missionInterface;
        if (missionInterfaceComp) {
            this.missionInterface.on('updateMissionDataEvent', this.checkIncludedSteps, this);
        }
    },

    checkIncludedSteps: function() {
        let isActive = false, isCompleted = false;
        if (this.stepsInGroup.length) {
            this.stepsInGroup.forEach((stepId) => {
                const id = parseInt(stepId);
                const includedStepData = this.missionInterface.getStepData(id);
                if (includedStepData && includedStepData.data) {
                    let stepStatus = includedStepData.data.state;
                    switch (stepStatus) {
                        case 'active': 
                            isActive = true;
                            isCompleted = false;
                            break;
                        case 'complete':
                            isCompleted = true;
                            break;
                    }
                }
            });
            if (isActive) {
                this.setStepIconActive();
            }
    
            if (isCompleted){
                this.setStepIconCompleted();
            }
        }
    },

    // Set Setep Icon sprite to Inactive state.
    setStepIconInactive: function() {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.iconDefault;
    },

    // Set Setep Icon sprite to Active state.
    setStepIconActive: function() {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.iconDefault;
        this.node.setScale(1,1);
    },

    // Set Setep Icon sprite to completed/redeem state.
    setStepIconCompleted: function() {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.iconCompleted;
    },

    //Trigger popUpWinddow linked to step block icon.
    toggleLinkedPopupWindow: function() {
        if (this.linkedNode) {
            let linkedNodeData = {
                name: this.linkedNode.name,
                isNodeActive: this.linkedNode.active
            };

            if (this.popupEventHandler && linkedNodeData) {
                this.popupEventHandler.emit([JSON.stringify(linkedNodeData)]);
            }
        }
    },
});
