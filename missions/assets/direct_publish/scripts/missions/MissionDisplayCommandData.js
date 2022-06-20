const BaseMissionComponent = require('BaseMissionComponent');

const TAG = 'ShoppingSpreePurchasableItem';
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
    extends: BaseMissionComponent,

    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        executeInEditMode: false,
    },

    properties: {
        targetLabel:{
            default:null,
            type:cc.Label,
        },
        commandDataKey:{
            default: "",
            tooltip: "Root key in command data for this value"
        },
        commandDataProperty:{
            default: '{}',
            multiline: true,
            tooltip:"JSON to specify where in the tree the property to display is found"
        },
        isPublicData:{
            default:false,
            tooltip: "Is the value being displayed in public command data instead of protected",
        }
    },

    onUpdateMissionData: function(){
        this._updateCommandDataDisplay();
    },

    _updateCommandDataDisplay: function(){
        if(!this.targetLabel){
            this.log.e("No label referenced to display command data");
            return;
        }
        if(this.commandDataKey !== "" && this.commandDataProperty !== ""){
            this.targetLabel.string = this._findCommandDataProp();
        }
    },

    /*
     * Using commandDataKey and commandDataProperty find the property we want to display
     * commandDataKey is the top level place to start in commandData. 
     * At each level of commandDataProperty there is a propName which is a key and a prop which
     * is either blank or another object with a propName to recursivly search at this level. There
     * may also be an index. If the object at the current level is an array, index tells you which
     * element to recursivly search. If prop is a blank string you have reached the end and should
     * return the value at propName.
     */
    _findCommandDataProp: function(){
        const commandData = this.missionInterface.getMissionCommandData(this.commandDataKey);
        //Object we will search through
        let returnVal = commandData;
        let parseObj = JSON.parse(this.commandDataProperty);
        return this._cmdDataSearchRec(returnVal, parseObj);
    },

    _cmdDataSearchRec: function(returnVal, parseObj){
        //Get the next property name
        let currProp = parseObj.propName;
        //Move through the nested obj to the next value
        returnVal = returnVal[currProp];
        if(Array.isArray(returnVal)){
            let index = parseObj.index;
            returnVal = returnVal[index];
        };
        
        if(parseObj.prop === ""){
            return returnVal;
        }
        parseObj = parseObj.prop;
        //Where to recursivly go to next?
        return this._cmdDataSearchRec(returnVal, parseObj);
    }

});
