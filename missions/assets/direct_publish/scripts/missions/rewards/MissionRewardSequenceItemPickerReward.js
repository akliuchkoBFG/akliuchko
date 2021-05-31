const TAG = "MissionRewardSequenceItemPicker";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardFilterLootboxReward = require('MissionRewardFilterLootboxReward');

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');
const MissionPickerItem = require('MissionPickerItem');
const MissionPickerLayout = require('MissionPickerLayout');

cc.Class({
    extends: MissionRewardSequenceItem,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Rewards/Sequence/Sequence Item Picker Reward',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        requireComponent: MissionRewardFilterLootboxReward,
    },

    properties: {
        // This helper was sourced from the tileHelper used in BoardGameController
        pickHelper: {
            type: cc.Node,
            default: null,
            tooltip: 'Helper for setting the array of picks using a parent container, orders picks by numeric value in the corresponding node name',
            editorOnly: true,
            notify() {
                if (!this.pickHelper || !CC_EDITOR) {
                    return;
                }
                this._setPickItems(this.pickHelper);
                this.pickHelper = null;
            },
        },
        // Pick Item nodes to handle receiving player input and animating their reveal/whiff
        pickItems: {
            type: [MissionPickerItem],
            default: [],
        },
    },

    loadItem() {
        this.node.on('lootbox_pickeritem.selected', (event) => {
            event.stopPropagation();
            this._tapToContinue(event.detail.pickIndex);
        });
        return this._loadingPromise || Promise.resolve();
    },

    // Set up itemData and product Package for filling out Reward Teasers later to reveal/whiff awards
    setReward(itemData, premiumItemModel) { // eslint-disable-line no-unused-vars
        this._itemData = itemData;
        const awardedPackageIndex = itemData.awardResult.result.productPackageIndex;
        const productPackageID = itemData.lootbox[awardedPackageIndex].productPackageID;
        this._awardedProductPackage = itemData.promoData.lootbox[productPackageID];
        // Build a map of product package IDs to shuffle
        this._itemProductPackageIDs = _.map(itemData.lootbox, (item) => {
            return item.productPackageID;
        });
        // Setup layout if the layout component is included
        const pickerLayout = this.node.getComponent(MissionPickerLayout);
        if(pickerLayout) {
            this._layoutNode = pickerLayout.setPickerFromProductPackage(this._itemData);
            if(this._layoutNode) {
                this._setPickItems(this._layoutNode);
            }
        }
    },

    supportsItem(itemData, premiumItemModel) {
        let supported = this._super(itemData, premiumItemModel);
        if (supported) {
            const pickerLayout = this.node.getComponent(MissionPickerLayout);
            if(pickerLayout) {
                // Check the supportsItem of the layout
                supported = pickerLayout.supportsItem(itemData, premiumItemModel);
            } else if (this.pickItems.length > 0) {
                // No layout, check for picks from a pickerHelper (added in Editor)
                supported = true;
            } else {
                // No layout and no pick items from editor
                supported = false;
            }
        }
        return supported;
    },

    _setPickItems(pickHelper) {
        // Setup picks based either on an editor node or a layout node
        const picks = pickHelper.getComponentsInChildren(MissionPickerItem);
        if (picks.length === 0) {
            this.log.d("MissionPickerItem components not found in Node " + pickHelper.name);
            if(CC_EDITOR) {
                this.log.d("MissionPickerItem components not found in Node " + pickHelper.name + ". Please add to component before using the helper.");
            }
            return;
        }
        let index = 1;
        const sortedPicks = _.sortBy(picks, (pick) => {
            const nodeName = pick.node.name = "pick_" + index;
            // Check if this is beyond the number of lootbox items we expect and mark out of bound nodes inactive
            if(!CC_EDITOR && index > this._lootboxSize) {
                pick.node.opacity = 0;
                pick.node.active = false;
            }
            index++;
            // Strip out all non-numeric characters for sorting
            return +nodeName.replace(/[^\d]+/g, '');
        });
        this.pickItems = sortedPicks;
        this._setupPickIndices();
    },

    _setupPickIndices() {
        // Update in editor labels for all pick items
        if (!this.pickItems || this.pickItems.length === 0) {
            this.log.e("no items found in pickItems array");
            return Promise.reject();
        }

        // assuming some things here, not sure this is the best way to do this
        for (let i = 0; i < this.pickItems.length; i++) {
            this.pickItems[i].setIndex(i);
        }
    },

    _waitForInput() {
        const waitForInput = new Promise((resolve) => {
            this._tapToContinue = resolve;
        });
        return waitForInput;
    },

    _handlePicked(index) {
        if (this.pickItems.length === 0) {
            this.log.e("no items found in pickItems array");
            return;
        }

        // Array of Animation promises used for processing all reveal and whiff animations AT THE SAME TIME***
        const animPromises = [];
        // Assign the reward to the picker item that was selected using a reward teaser to handle the item shown
        this.pickItems[index].assignReward(this._awardedProductPackage);
        // Add the Reveal Animation to the promise array
        animPromises.push(this.pickItems[index].animateReveal());

        // Shuffle product package IDs to get a randomized appearance for whiff rewards
        const shuffledItems = _.shuffle(this._itemProductPackageIDs);
        for (let i = 0; i < this.pickItems.length; i++) {
            if (this.pickItems[i] == null) {
                continue;
            }
            // Check that we are not setting up the already awarded index by skipping it
            // This will avoid changing the awarded product package and adding a whiff Promise to the revealed Picker Item
            // Allows a clear dileneation from the reveal step and whiff step and could act as an entry point for a pick until setup
            if(i === index) {
                continue;
            }            
            // Gather the lootbox item either within the bounds of our shuffle or at random if the lootbox is smaller than the number of pick locations
            let lootboxItem;
            if(i < shuffledItems.length) {
                lootboxItem = this._itemData.promoData.lootbox[shuffledItems[i]];
            } else {
                const rand = Math.random() * Math.floor(shuffledItems.length);
                lootboxItem = this._itemData.promoData.lootbox[shuffledItems[rand]];
            }
            // Assign the rewards that will be used in the whiff picker items to display items that could have been awarded
            this.pickItems[i].assignReward(lootboxItem);
            // Add the Whiff Animation(s) to the promise array
            animPromises.push(this.pickItems[i].animateWhiff());
        }
        // Fulfill all picker item aanimation Promises AT THE SAME TIME***
        // ***This will need to be adjusted when choreography decisions have been made, as this requires the animations to handle timing on their own
        // e.g. the placeholder reveal animation starts immediately once the promise is fulfilled and the whiff animations happen offset after the reveal animation would have finished.
        return Promise.all(animPromises);
    },

    playItem() {
        return this.loadItem()
        .then(() => {
            return this.intro.play();
        })
        .then(() => {
            return this._waitForInput();
        })
        .then((index) => {
            return this._handlePicked(index);
        })
        .then(() => {
            return this.outro.play();
        }).catch((err) => {
            this.log.e("playItem failure: " + err);
            this.log.d("Reward item data: " + JSON.stringify(this._itemData));
            this.node.active = false;
        });
    },

    sample() {
        this.intro.sample();
    },
});
