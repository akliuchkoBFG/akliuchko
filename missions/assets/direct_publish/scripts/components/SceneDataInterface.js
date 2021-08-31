const TAG = "SceneData";
const ComponentLog = require('ComponentSALog')(TAG);

const SceneDataMapping = require('SceneDataMapping');

cc.Class({
    extends: cc.Component,

    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Scene Data/Interface',
    },

    properties: {
        // array of data items containing objects with key: value pairs (access using this.sceneData[index] and .dataKey or .dataValue)
        sceneData: {
            default: [],
            type: [SceneDataMapping],
            tooltip: 'Data items with Keys and text to replace when using these keys in a label',
        },
    },

    setMapping(key, text) {
        let keyExists = false;
        for (let i = 0; i < this.sceneData.length; i++) {
            if (this.sceneData[i].getKey() === key) {
                this.sceneData[i].setValue(text);
                keyExists = true;
                this.log.d("SceneData: Setting Mapping \"" + this.sceneData[i].getKey() + "\" to the value \"" + text + "\"");
            }
        }

        if(!keyExists) {
            this.log.w("No key named \"" + key + "\" exists in the set of mappings.");
        }
    },

    getDataMap() {
        return this.sceneData;
    },

});
