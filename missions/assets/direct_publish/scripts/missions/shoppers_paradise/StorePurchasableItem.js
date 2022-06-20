const TableViewCell = require('TableViewCell');
const StorePurchaseConfirmViewController = require('StorePurchaseConfirmViewController');
const MissionDisplayCommandData = require('MissionDisplayCommandData');
const MissionRewardTeaser = require('MissionRewardTeaser');
const StoreInsufficientFundsViewController = require('StoreInsufficientFundsViewController');

const TAG = 'ShoppingSpreePurchasableItem';
const ComponentLog = require('ComponentSALog')(TAG);


const PurchasableItemState = cc.Enum({
    Initial: 0,
    Available: 1,
    SoldOut: 2,
    Infinite: 3,
});

const SpineStateProperty = require('SpineStateProperty');
const SPINE_STATE_NAMES = [
    'sold_out'
];
const SKELETON_COMPONENT_PROP = 'skeleton';

const STORE_COMMAND_DATA_NAME = "pointsShop";
const STORE_CURRENCY_COMMAND_DATA = "points";
const STORE_COMMAND_AWARD_ARRAY_NAME = "shopAwards";
const STORE_COMMAND_ITEM_PRICE = "pointsPrice";

cc.Class({
    extends: TableViewCell,

    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        executeInEditMode: true,
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        menu: 'Missions/Types/Shopping Spree/Store Purchasable Item',
    },

    properties: {
        rewardView:{
            default: null,
            type: MissionRewardTeaser,
        },
        costLabel: {
            default: null,
            type: MissionDisplayCommandData,
            tooltip: `
            Label to display cost of the item.
            Uses MissionDisplayCommandData to show price from command data. It's commandDataProperty
            will be set dynamically at runtime when this flyout is instantiated
            `
        },
        storePurchaseConfirmViewController: {
            default: null,
            type: StorePurchaseConfirmViewController,
        },
        storeInsufficientFundsViewController: {
            default: null,
            type: StoreInsufficientFundsViewController,
        },
        storeInsufficientFundsPosition: {
            default: null,
            type: cc.Node,
            tooltip: "Location of this node is where the insufficient funds tooltip will get placed relative to the purchase item"
        },

        skeleton: SpineStateProperty.spSkeletonForProperties(
            SKELETON_COMPONENT_PROP,
            SPINE_STATE_NAMES,
            [
                // Tooltips
            ].join('\n')
        ),
        sold_out: SpineStateProperty.propertyDefinition(
            SKELETON_COMPONENT_PROP,
            'sold_out'
        ),
    },

    onLoad: function () {
        if(!this._initialized){
            this._soldOutShown = false;
            this._initialized = true;
            this._isClickable = true;

            this._itemState = PurchasableItemState.Initial;
            //costLabel is not required
            if(this.costLabel){
                this.costLabel.missionInterface = this.missionInterface;
            }
            //We don't start with missionInterface assigned so we have to register for this event ourselves
            if (this.missionInterface) {
                this.missionInterface.on('updateMissionDataEvent', this.onUpdateMissionData, this);
                const pointsShopCommandData = this.missionInterface.getMissionCommandData(STORE_COMMAND_DATA_NAME);
                this._quantity = pointsShopCommandData[STORE_COMMAND_AWARD_ARRAY_NAME][this._index].quantityRemaining;
            }
            
            this.onUpdateMissionData();

            //If we are in the sold out state the animation needs to be played now.
            if(this._itemState === PurchasableItemState.SoldOut){
                this._handleSoldOut();
            }
        }
    },

    
    onUpdateMissionData: function() { 
        if(this.missionInterface){
            this._updateQuantityAndCurrency();
        }
    },
    
    /*
     * For implementation of TableViewCell
     * When this prefab is created we need to set references, initial property values, and event listeners
     */
    updateCellData(data) {
        this.setIndex(data.index);
        this.missionInterface = data.missionInterface;
        this.storePurchaseConfirmViewController = data.storePurchaseConfirmViewController;
        this.storeInsufficientFundsViewController = data.storeInsufficientFundsViewController;
        this._awardData = data.awardData;
        this._itemCost = this._awardData[STORE_COMMAND_ITEM_PRICE];
        this.rewardView.setRewardsFromProductPackage(this._awardData.award);
        this.on('storeItemPurchaseConfirm', data.storeLayoutViewController.playRewardSequence, data.storeLayoutViewController);
        this.on('showStoreInsufficientFunds', data.storeInsufficientFundsViewController.showDisplayForIndex, data.storeInsufficientFundsViewController);
        this.on('showStoreDisplay', data.storePurchaseConfirmViewController.showDisplayForIndex, data.storePurchaseConfirmViewController);
        data.storePurchaseConfirmViewController.on('storeItemsEnable',(event) => this.setIsClickable(event.detail.enable));
        data.storeLayoutViewController.on('storeItemsEnable', (event) => this.setIsClickable(event.detail.enable));
        data.storeLayoutViewController.on('purchaseAwarded', (event) => this._handlePurchase(event.detail.index));;
    },

    /*
     * More than a setter for this._index
     * If we have a MissionDisplayCommandData to display item price, it needs the correct json for it's commandDataProperty
     */
    setIndex: function(index){
        this._index = index;
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
        this.costLabel.commandDataProperty = JSON.stringify(commandDataProperty);
    },

    /*
     * The onClick listener for the item itself emits an event listened to by StorePurchaseConfirmViewController
     * StorePurchaseConfirmViewController will set it's current item index and display itself to the user
     */
    onClick: function(){
        // If the item is not clickable at all, do nothing and return early
        if(!this._isClickable || !this.isAvailable()){
            return;
        }
        // Only if the item is available, purchase it.
        if(this._isAffordable()){
            this.emit('showStoreDisplay', {
                index: this._index
            });
        }
        else {
            //Show the insufficient funds popup.
            this.emit('showStoreInsufficientFunds', {
                index: this._index,
                node: this.node,
                offset: this.storeInsufficientFundsPosition,

            });
        }
    },

    /*
     * Utility to know if an item is sold out or not
     */
    isAvailable: function(){
        return this._itemState !== PurchasableItemState.SoldOut;
    },

    /*
     * Setter for this._itemState
     * Only set this._itemState within the switch case to ensure it's a valid member of the Enum
     * We could also have custom side effects for setting specific state but design has moved away from that
     */
    setState: function(purchasableItemState){
        switch(purchasableItemState){
            case PurchasableItemState.Available:
                this._itemState = PurchasableItemState.Available;
            break;
            case PurchasableItemState.SoldOut:
                this._itemState = PurchasableItemState.SoldOut;
            break;
            case PurchasableItemState.Infinite:
                this._itemState = PurchasableItemState.Infinite;
            break;
        }
    },

    /*
     * Controlling when store items click events are being blocked. When dialog UI
     * elements are open you should not be able to click shop items.
     */
    setIsClickable: function(isClickable){
        this._isClickable = isClickable;
    },

    /*
     * Keep an internal count of current player points to determine if this item can be purchased
     */
    _updateQuantityAndCurrency: function(){
        if(this.missionInterface){
            const pointsCommandData = this.missionInterface.getMissionCommandData(STORE_CURRENCY_COMMAND_DATA);
            const pointsShopCommandData = this.missionInterface.getMissionCommandData(STORE_COMMAND_DATA_NAME);
            const quantityRemaining = pointsShopCommandData[STORE_COMMAND_AWARD_ARRAY_NAME][this._index].quantityRemaining;
            if(quantityRemaining > 0){
                this.setState(PurchasableItemState.Available);
            } else {
                this.setState(PurchasableItemState.SoldOut);
            }
            this._quantity = quantityRemaining;
            this._currencyRemaining = pointsCommandData.current;
        }
    },

    /*
     * Utility to know if an item can be purchased right now or not
     */
    _isAffordable: function() {
        return this._currencyRemaining >= this._itemCost;
    },

    /*
     * Emit the event showing the reward sequence from StoreLayoutController
     * Use _handleSoldOut to do the sold out animation first if appropriate
     */
    _handlePurchase: function(index){
        if(index !== this._index) {
            return;
        }
        this._handleSoldOut().bind(this).then(function(){
            this._updateQuantityAndCurrency();
            this.emit('storeItemPurchaseConfirm', {
                index: this._index
            });
        });
    },

    /*
     * Show the sold out animation in a safe manner. Will only do it if current state is appropriate
     */
    _handleSoldOut:function(){
        if(this._quantity === 0 && !this._soldOutShown){
            this._soldOutShown = true;
            return this.sold_out.play();
        }
        return Promise.resolve(true);
    }

});
