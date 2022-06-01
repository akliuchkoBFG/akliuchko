const TAG = "MissionRewardSequenceItemDropEms";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardFilterLootboxReward = require('MissionRewardFilterLootboxReward');

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');
const MissionRewardTeaser = require('MissionRewardTeaser');
const MissionDropEmsDropPoint = require('MissionDropEmsDropPoint');
const AnimationClipProperty = require('AnimationClipProperty');

const DROPANIM_COMPONENT_PROPERTY = 'dropEmAnimation';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

cc.Class({
    extends: MissionRewardSequenceItem,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Rewards/Lootbox/Drop Ems Reward Item',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        requireComponent: MissionRewardFilterLootboxReward,
    },

    properties: {
        buckets: {
            type: [MissionRewardTeaser],
            default: [],
        },
        dropPoints: {
            type: [MissionDropEmsDropPoint],
            default: [],
        },
        finalReward: {
            type: MissionRewardTeaser,
            default: null,
        },
        startPopup: {
            type: cc.Node,
            default: null,
        },
        dropEmAnimation: AnimationClipProperty.ccAnimationForProperties(
            DROPANIM_COMPONENT_PROPERTY,
            [
                'bucket_highlight',
                'drop_point_selected',
                'selection_intro',
            ],
            'Configurable animations to handle bucket and drop point highlight and cleanup'
        ),
        bucket_highlight: AnimationClipProperty.propertyDefinition(
            DROPANIM_COMPONENT_PROPERTY,
            'Animation that plays to emphasize the selected bucket reward'
        ),
        drop_point_selected: AnimationClipProperty.propertyDefinition(
            DROPANIM_COMPONENT_PROPERTY,
            'Animation that handles cleanup on spine states when drop point is selected'
        ),
        selection_intro: AnimationClipProperty.propertyDefinition(
            DROPANIM_COMPONENT_PROPERTY,
            'Animation that introduces the drop point selection, playing after the start popup is closed'
        ),
    },

    loadItem() {
        for (let i = 0; i < this.dropPoints.length; i++) {
            this.dropPoints[i].setIndex(i);
        }

        return Promise.map(this.buckets, (teaser) => {
            return teaser.loadItem();
        });
    },

    // Supports item is checking that there are buckets and drop points available to process
    supportsItem(itemData, premiumItemModel) {
       let supported = this._super(itemData, premiumItemModel);
        if (supported) {
            if (this.dropPoints.length > 0 && this.buckets.length > 0) {
                supported = true;
            } else {
                supported = false;
            }
        }
        return supported;
    },

    // Setup the product package display for the buckets as well as the final reward display.
    // This also sets up the filler buckets for display
    setReward(itemData/* , premiumItemModel*/) {
        const awardedPackageIndex = itemData.awardResult.result.productPackageIndex;
        const awardedProductPackageID = itemData.lootbox[awardedPackageIndex].productPackageID;
        this._awardedProductPackage = itemData.promoData.lootbox[awardedProductPackageID];

        // Setup the reward bucket randomly
        const rewardBucketIndex = Math.floor(Math.random() * this.buckets.length);
        this.buckets[rewardBucketIndex].setRewardsFromProductPackage(this._awardedProductPackage);
        this._awardBucket = rewardBucketIndex;

        // Setup the final reward used for display sequence
        this.finalReward.setRewardsFromProductPackage(this._awardedProductPackage);

        // Exclude selected reward from lootbox items to use as filler rewards
        const fillerRewards = _.without(itemData.lootbox, itemData.lootbox[awardedPackageIndex]);
        // Build a map of product package IDs to shuffle
        this._itemProductPackageIDs = _.map(fillerRewards, (item) => {
            return item.productPackageID;
        });

        // Grab items shuffled for filling 'empty' buckets
        const shuffledIndices = _.shuffle(this._itemProductPackageIDs);

        if (shuffledIndices.length < this.buckets.length - 1) {
            this.log.e("Not enough items in the mission to fill out unique buckets, expected " + this.buckets.length - 1 + " items, but only found " + shuffledIndices.length);
            return;
        }

        let shuffleIndex = 0;
        // Setup filler rewards and ignore the already awarded bucket
        for (let i = 0; i < this.buckets.length; i++) {
            if (i === rewardBucketIndex) {
                continue;
            }

            const packageID = shuffledIndices[shuffleIndex];
            const fillerReward = itemData.promoData.lootbox[packageID];
            this.buckets[i].setRewardsFromProductPackage(fillerReward);
            shuffleIndex++;
        }
    },

    // Handle Start Game click event
    startGameHandler() {
        const customEvent = new cc.Event.EventCustom('dropems_startgame', true);
        this.node.dispatchEvent(customEvent);
    },

    // Waits for clickhandler for player CTA start popup to continue the next part of the sequence
    _startGame() {
        const waitForInput = new Promise((resolve) => {
            this._startClick = resolve;
        });
        this.node.on('dropems_startgame', (event) => {
            this._startClick();
            event.stopPropagation();
            this.startPopup.active = false;
            this.startPopup.opacity = 0;
        });
        // Selection Intro animation to show drop points
        return waitForInput
        .then(() => {
            return this.selection_intro.play();
        });
    },

    // Listens for the drop point click event to continue to the animation for drop
    _waitForDrop() {
        const waitForInput = new Promise((resolve) => {
            this._tapToContinue = resolve;
        });
        this.node.on('dropems_drop_point.selected', (event) => {
            this._tapToContinue(event.detail.dropIndex);
            event.stopPropagation();
        });
        return waitForInput;
    },

    // The actual drop; hides unselected visible drop points if shown and plays the drop sequence based on the point selected and the bucket to transit to (awarded bucket)
    _handleDrop(dropIndex) {
        this.dropPoints.forEach((drop) => {
            if (drop.getIndex() !== dropIndex) {
                drop.node.active = false;
                drop.node.opacity = 0;
            }
        });

        // Process bucket names to allow easy animation based on a preset pattern for selected and whiff
        //  this has an expectation of a preset animation where the selected item is postfixed with "_selected"
        //      and all 'whiff' elements are postfixed as "_whiff_1", "_whiff_2" etc.
        let whiffCount = 1;
        this.buckets.forEach((bucket, index) => {
            let name;
            if (index === this._awardBucket) {
                name = "selected";
            } else {
                name = "whiff_" + whiffCount;
                whiffCount++;
            }
            bucket.node.name = "bucket_" + name;
        });

        // Force reload animState to ensure no caching after renaming nodes
        this.bucket_highlight.reloadClip();

        return this.drop_point_selected.play()
        .then(() => {
            return this.dropPoints[dropIndex].playFull(this._awardBucket);
        })
        .then(() => {
            return this.bucket_highlight.play();
        });
    },

    // Play sequence order:
    //     Intro Animation ->
    //         Start Game popup text box ->
    //             Wait for player input for drop selection ->
    //                 Handle the drop animation ->
    //                     Play outro sequence with awarded item(s)
    playItem() {
        return this.loadItem()
        .then(() => {
            return this.intro.play();
        })
        .then(() => {
            return this._startGame();
        })
        .then(() => {
            return this._waitForDrop();
        })
        .then((index) => {
            return this._handleDrop(index);
        })
        .then(() => {
            return this.outro.play();
        }).catch((err) => {
            this.log.e("playItem failure: " + err);
            this.log.d("Reward item data: " + JSON.stringify(this._itemData));
            this.node.active = false;
        });
    },
});
