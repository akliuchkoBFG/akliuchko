const StoreMissionDialogViewController = require('StoreMissionDialogViewController');
const MissionInterface = require('MissionInterface');
const MissionRewardTeaser = require('MissionRewardTeaser');
const MissionDisplayCommandData = require('MissionDisplayCommandData');

const TAG = 'StorePurchaseConfirmViewController';
const ComponentLog = require('ComponentSALog')(TAG);

const STORE_COMMAND_DATA_NAME = "pointsShop";
const STORE_COMMAND_AWARD_ARRAY_NAME = "shopAwards";
const STORE_COMMAND_ITEM_PRICE = "pointsPrice";

cc.Class({
    extends: StoreMissionDialogViewController,

    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        menu: 'Missions/Types/Shopping Spree/Store Purchase Confirm View Controller',
    },

    properties: {
        missionInterface: {
            default: null,
            type: MissionInterface,
        },
        rewardView:{
            default: null,
            type: MissionRewardTeaser,
            tooltip: `
            Displays the teaser for the item offered to be purchased. Should be the same
            teaser shown on the item that was selected
            `
        },
        costLabels: {
            default: [],
            type: [MissionDisplayCommandData],
            tooltip:`
            Show the cost of the item in offer. Uses MissionDisplayCommandData to show
            the data from the command data and it's commandDataProperty will be set
            dynamically when this popup is enabled. Takes an array mostly to support
            dropshadow or any other effect the requires multiple text nodes.
            `
        },
    },

    /*
     * Event invoked from a StorePurchasableItem when an item is clicked
     * This event is expected to have a valid index property in it's payload
     * Sets the confirm dialog's current item index and displays it
     */
    showDisplayForIndex: function(event){
        this.setIndex(+event.detail.index);
        this._setupRewardTeaser(this._index);
        this._updateCostLabel();
        this.showDisplay()
        .then(function(){
            this.emit('storeItemsEnable', {
                enable: false
            });
        });
    },

    /* 
     * The onClick listener for the confirm purchase button
     */
    confirmPurchase: function(){
        // Return early if index is -1
        if(this._index === -1){
            return;
        }
        if (!this.hideDialog.isValid()) {
            this.log.e("Invalid hideDialog animation clip");
        }
        this.hideDialog.play().bind(this).then(function(){
            this.emit('storePurchase', {
                index: this._index
            });
        });
    },

    /*
     * Pulls the product package data from store's command data. Product package
     * is used to set the correct MissionRewardTeaser data
     */
    _setupRewardTeaser: function(index){
        const pointsShopCommandData = this.missionInterface.getMissionCommandData(STORE_COMMAND_DATA_NAME);
        let shopAwards = pointsShopCommandData[STORE_COMMAND_AWARD_ARRAY_NAME];
        let awardData = shopAwards[index];
        this.rewardView.setRewardsFromProductPackage(awardData.award);
    },

    // Set the json for the commandDataProperty's of each costLabel
    _updateCostLabel: function(){
        let commandDataProperty = 
            {
                "propName": STORE_COMMAND_AWARD_ARRAY_NAME,
                "index": this._index,
                "prop": {
                    "index": this._index,
                    "propName": STORE_COMMAND_ITEM_PRICE,
                    "prop": "",
                }
            };
        this.costLabels.forEach(function(label){
            label.commandDataProperty = JSON.stringify(commandDataProperty);
        });
    },
});
