const TAG = "MissionPickerLayout";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardFilter = require('MissionRewardFilter');

cc.Class({
    extends: cc.Component,

    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Picker/Layout Filtering',
    },

    properties: {
        pickerPrefabs: {
            type: [cc.Prefab],
            default: [],
            tooltip: [
                "MissionPickerLayout prefabs.",
                "Component selects the last prefab in the list that satisfies all filters for the specified picker",
                "To be used with MissionRewardSequenceItemPickerReward to handle filtering specific to a picker reward",
            ].join('\n'),
        },
    },

    setPickerFromProductPackage(rewardItems) {
        if (CC_EDITOR) {
            return; // Dynamic rewards displays are not supported in-editor
        }
        if (_.isEqual(this._rewardItems, rewardItems)) {
            return; // Attempting to configure this component multiple times with the same product package
        } else if (this._layoutNode) {
            // Cleanup previously configured reward
            this._layoutNode.removeFromParent();
            this._layoutNode = null;
        }
        // Picker does not need extra logic for reward items, we will just pull the first lootbox relevant
        // this is a pass through
        this._rewardItems = rewardItems;
        return this._addLayout();
    },

    supportsItem(itemData, premiumItemModel) { // eslint-disable-line no-unused-vars
        for (let i = this.pickerPrefabs.length - 1; i >= 0; i--) {
            const prefab = this.pickerPrefabs[i];
            if (!prefab) {
                continue;
            }
            const filters = prefab.data.getComponents(MissionRewardFilter);
            // Picker just needs the product package and does not use any premium item data
            // Will return the layout for the first supported filter (This follows the current way filters are used in rewards, matching at least 1)
            for(const filter of filters) {
                if (filter.supportsItem(itemData, null)) {
                    return true;
                }
            }
        }
        return false;
    },

    _addLayout() {
        const layoutNode = this._createPickerNode();
        if (layoutNode) {
            this.node.addChild(layoutNode);
            this._layoutNode = layoutNode;
            return this._layoutNode;
        } else {
            this.log.e("No eligible picker layout prefab for lootbox in product package: " + JSON.stringify(this._rewardItems));
        }
        return null;
    },

    _createPickerNode() {
        let layoutNode = null;
        // Look at this list backwards as the newest added prefab will most likely be more specific and therefore higher priority
        for (let i = this.pickerPrefabs.length - 1; i >= 0; i--) {
            const prefab = this.pickerPrefabs[i];
            if (!prefab) {
                continue;
            }
            const filters = prefab.data.getComponents(MissionRewardFilter);
            // Picker just needs the product package and does not use any premium item data
            // Will return the layout for the first supported filter (This follows the current way filters are used in rewards, matching at least 1)
            for(const filter of filters) {
                if (filter.supportsItem(this._rewardItems, null)) {
                    layoutNode = cc.instantiate(prefab);
                    return layoutNode;
                }
            }
        }
        return layoutNode;
    },
    
});
