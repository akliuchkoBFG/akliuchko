const TAG = "MissionRewardFilterLootboxSize";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardFilter = require('MissionRewardFilter');

cc.Class({
    extends: MissionRewardFilter,

    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Rewards/Filters/Lootbox Size',
    },

    properties: {
        minSize: {
            default: 1,
            type: cc.Integer,
            min: 1,
            max: 48,
        },
        maxSize: {
            default: 1,
            type: cc.Integer,
            min: 1,
            max: 48,
        },
    },

    // @Override
    // Filters eligible items based on an allowed min and max size of a lootbox
    supportsItem(itemData, premiumItemModel) { // eslint-disable-line no-unused-vars
        this.log.d("Lootbox Size Filter Data: " + JSON.stringify(itemData));
        // Check whether the data received is actually a lootbox
        if(itemData.productPackageType !== 'ProductPackageItemLootBox') {
            this.log.d("Data received does not contain a lootbox. Check Mission Data or change filter type.");
            return false;
        }
        const lootboxSize = itemData.lootbox.length;
        if(lootboxSize >= this.minSize && lootboxSize <= this.maxSize) {
            return true;
        }
        return false;
    },
});