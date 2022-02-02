const TAG = "SceneData";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionStepComponent = require('BaseMissionStepComponent');
const SceneDataInterface = require('SceneDataInterface');

cc.Class({
    extends: BaseMissionStepComponent,

    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Labels/Flavor Text/Step ID Flavor Text',
        requireComponent: SceneDataInterface,
    },

    properties: {
        // The Key name to update with this flavor component
        flavorKey: {
            default: "",
        },
        // Holds the mappings for individual step data, each index is mapped directly to the step
        stepTextValues: {
            default: [],
            type: [cc.String],
            tooltip: "Text here maps to the stepID based on it's position in the array. e.g. [0] maps to stepID 0",
        },
    },

    onUpdateMissionStepData() {
        // Change the text that is used by the sceneData based on the step
        if(this.stepTextValues[this.missionStepInterface.stepID]) {
            this.getComponent(SceneDataInterface).setMapping(this.flavorKey, this.stepTextValues[this.missionStepInterface.stepID]);
            this.log.d("FlavorText: Changing \"" + this.flavorKey + "\" to use text \"" + this.stepTextValues[this.missionStepInterface.stepID] + "\"");
        }

        let event = new cc.Event.EventCustom('scenedatachanged', true);
        event.detail = "FlavorTextStep";
        this.node.dispatchEvent(event);
    },

});
