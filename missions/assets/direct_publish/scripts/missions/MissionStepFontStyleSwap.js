const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        executeInEditMode: true,
        menu: 'Add Mission Component/Mission Step Font Style Swap',
        // TODO help: make a wiki url
    },

    properties: {
        fonts:{
            default: [],
            type: [cc.Font]
        },
        defaultFont: {
            default: null,
            type: cc.Font
        },
        nodeColors: {
            default: [],
            type: [cc.Color]
        },
        defaultNodeColor: {
            default: new cc.Color
        },
    },

    onUpdateMissionStepData: function() {
        // Get a label if there is one to change the font
        let label = this.getComponent("cc.Label");
        let stepID = parseInt(this.missionStepInterface.stepID);
        let fontIndex = stepID, nodeColorIndex = stepID;
        let useDefaultFont = true, useDefaultColor = true;

        
        if(!!label) {
            if(fontIndex !== undefined && fontIndex !== null) {
                if(!this.defaultFont){
                    fontIndex = fontIndex % this.fonts.length;
                }
                if(this.fonts[fontIndex]){
                    label.font = this.fonts[fontIndex];
                    useDefaultFont = false;
                }
            }
            //If we have a default font and we need to use it
            if(this.defaultFont && useDefaultFont) {
                label.font = this.defaultFont;
            }
        }

        if(nodeColorIndex !== undefined && nodeColorIndex !== null) {
            if(!this.defaultNodeColor){
                nodeColorIndex = nodeColorIndex % this.nodeColors.length;
            }
            if(nodeColorIndex < this.nodeColors.length){
                this.node.color = this.nodeColors[nodeColorIndex];
                useDefaultColor = false;
            }
        }
        //If we have a default color and we need to use it
        if(this.defaultNodeColor && useDefaultColor) {
            this.node.color = this.defaultNodeColor;
        }
    },
});
