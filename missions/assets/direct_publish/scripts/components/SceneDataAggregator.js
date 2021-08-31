const TAG = "SceneData";
const ComponentLog = require('ComponentSALog')(TAG);

const SceneDataInterface = require('SceneDataInterface');
const SceneDataMapping = require('SceneDataMapping');

// Component with sole purpose of combining and serving a set of client data back to any labels that may need it before using server data
cc.Class({
    extends: cc.Component,

    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Scene Data/Aggregator',
        executeInEditMode: true,
        disallowMultiple: true,
    },

    properties: {
            sceneDataComponents: {
                default: [],
                type: [SceneDataInterface],
                tooltip: "Data components that define the keys used to add text to various RichText segments",
            },

            sceneDataMap: {
                // collection containing mappings between keys and the index of their component in the sceneDataComponents array
                default: {},
                visible: false,
            },

    },

    onLoad() {
        this.node.on('scenedatachanged', function ( event ) {
            this.updateSceneDataMap();
            this.log.d("Scene Data Updated, Map Updated. Event received from " + event.detail);

        }.bind(this));
    },

    getSceneData() {
        this.updateSceneDataMap();
        return this.sceneDataMap;
    },

    updateSceneDataMap() {
        this.sceneDataMap = {};
        // Build the component list again, taking the keys from each and indexing them into the sceneDataArray
        for(let i = 0; i < this.sceneDataComponents.length; i++) {
            // For each component, get its data map
            const data = this.sceneDataComponents[i].getDataMap();
            for(let j = 0; j < data.length; j++) {
                let mapping = data.find((c) => {
                    return c.getKey();
                });
                //this.log.d(mapping.getKey() + ": " + mapping.getText());
                this.sceneDataMap[mapping.getKey()] = mapping.getText();
            }
        }

        this.log.d(JSON.stringify(this.sceneDataMap));
    },

});
