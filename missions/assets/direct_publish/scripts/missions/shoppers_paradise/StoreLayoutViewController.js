const AnimationClipProperty = require('AnimationClipProperty');
const BaseMissionComponent = require('BaseMissionComponent');
const StorePurchaseConfirmViewController = require('StorePurchaseConfirmViewController');
const StoreInsufficientFundsViewController = require('StoreInsufficientFundsViewController');
const MissionRewardSequence = require('MissionRewardSequence');
const TableView = require('TableView');

const TAG = 'StoreLayoutViewController';
const ComponentLog = require('ComponentSALog')(TAG);

const STORE_COMMAND_DATA_NAME = "pointsShop";
const STORE_COMMAND_AWARD_ARRAY_NAME = "shopAwards";

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
    'stepProgressState',
    'allStepsCompleteState',
    'allItemsPurchasedState'
];

cc.Class({
    extends: BaseMissionComponent,

    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        executeInEditMode: false,
        menu: 'Missions/Types/Shopping Spree/Store Layout View Controller',
    },
    
    properties: {
        itemShelfTableView:{
            default: null,
            type: TableView,
            tooltip: "Table view for displaying the store prefabs",
        },
        purchasableItemPrefab:{
            default: null,
            type: cc.Prefab,
            tooltip: "Prefab containing StorePurchasableItem",
        },
        rewardSequence: {
            default: null,
            type: MissionRewardSequence,
            tooltip: "Reference to the reward sequence that plays for puchasing an item in the store"
        },
        storePurchaseConfirmViewController:{
            default: null,
            type: StorePurchaseConfirmViewController,
        },
        storeInsufficientFundsViewController: {
            default: null,
            type: StoreInsufficientFundsViewController,
        },
        animation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            ANIM_CLIP_NAMES,
            [
                'Animation component for showing the final state after all items are purchased',
            ].join('\n')
        ),
        stepProgressState: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'State for all steps earning progress'
        ),
        allStepsCompleteState: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'All steps complete'
        ),
        allItemsPurchasedState: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'All items purchased'
        ),
    },

    // use this for initialization
    onLoad: function () {
        this._initialized = false;
        this._super();
        this.storePurchaseConfirmViewController.on('storePurchase', this._onStorePurchase, this);
    },

    onUpdateMissionData: function(){
        const pointsShopCommandData = this.missionInterface.getMissionCommandData(STORE_COMMAND_DATA_NAME);
        this.shopAwards = pointsShopCommandData[STORE_COMMAND_AWARD_ARRAY_NAME];
        if (!CC_EDITOR) {
            if(!this._initialized){
                this._layoutPurchaseItems(this.shopAwards);
                this._initialized = true;
            }
        }
        let totalQuantity = 0;
        this.shopAwards.forEach(function(shopAward){
            totalQuantity += shopAward.quantityRemaining;
        }, this);
        const isMissionFinished = this.missionInterface.isMissionFinished();
        if(totalQuantity === 0){
            this.allItemsPurchasedState.play();
        } else if(isMissionFinished){
            this.allStepsCompleteState.play();
        } else {
            this.stepProgressState.play();
        }
    },

    /*
     * Set the product package and play the reward sequence from an event.
     * This event is expected to have a valid index property in it's payload
     */
    playRewardSequence: function(event){
        const index = +event.detail.index;
        const pointsShopCommandData = this.missionInterface.getMissionCommandData(STORE_COMMAND_DATA_NAME);
        let productPackageRewardData = pointsShopCommandData[STORE_COMMAND_AWARD_ARRAY_NAME][index].award;
        this.rewardSequence.setRewardsFromAwardAndResult(productPackageRewardData, this._recentAwardResult);
        this.rewardSequence.playSequence().bind(this)
        .then(function(){
            // Once the reward sequence is done we can reenable the pick items
            this.emit('storeItemsEnable',{
                enable: true
            }); 
        });
    },

    /*
     * Populate the TableView with PurchaseItem prefabs
     * Each one is a single item in the store
     * Data passed includes references required to set up events
     */
    _layoutPurchaseItems: function(shopAwards){
        this.itemShelfTableView.addCellPrefab(this.purchasableItemPrefab);
        const cellData = shopAwards.map((awardData, index) => {
            return {
                prefab: this.purchasableItemPrefab.name,
                data: {
                    index: index,
                    missionInterface: this.missionInterface,
                    storePurchaseConfirmViewController: this.storePurchaseConfirmViewController,
                    storeInsufficientFundsViewController: this.storeInsufficientFundsViewController,
                    storeLayoutViewController: this,
                    awardData: awardData,
                },
            };
        }, this);
        this.itemShelfTableView.setCellData(cellData);
    },

    /*
     * Call the command to purchase an item in the shop
     * This has to be from an event because this get emitted from on an onclick lister
     * in StorePurchaseConfirmViewController. Making this an event keeps them separate
     * This event is expected to have a valid index property in it's payload
     */
    _onStorePurchase: function(event){
        const index = +event.detail.index;
        return this.missionInterface.callCommand('purchaseAward', {'shopIndex': index}, true).then((result) => {
            this._recentAwardResult = result.commandResult.awardResult;
            this.emit('purchaseAwarded',{
                index:index
            });
            return result;
        });
    },
    
});
