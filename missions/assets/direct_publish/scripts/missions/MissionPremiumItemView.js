const TAG = "MissionPremiumItemView";
const ComponentLog = require('ComponentSALog')(TAG);

const SAImage = require('SAImage');
const SASpine = require('SASpine');
const NumericLabel = require('NumericLabel');
const NodeSelector = require('NodeSelector');

const SPINE_DISPLAY_TYPES = ['frame'];
const AVATAR_DISPLAY_TYPES = ['frame'];

const PremiumItemType = cc.Enum({
    'generic' : 0,
    'chips' : 1,
    'token' : 2,
    'prestige' : 3,
});

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog],

    editor: {
        menu: 'Add Mission Component/Rewards/Premium Item View',
        disallowMultiple: true,
    },

    properties: {
        itemType: {
            default: PremiumItemType.generic,
            type: PremiumItemType
        },
        imageLoader: {
            default: null,
            type: SAImage,
        },
        imageName: {
            default: 'reward',
            tooltip: "Name of the image to use from this premium item's client config",
        },
        spineLoader: {
            default: null,
            type: SASpine,
        },
        spineName: {
            default: '',
            tooltip: "Name of the spine asset to use from this premium item's client config",
        },
        avatarImage: {
            default: null,
            type: SAImage,
        },
        displayName: {
            default: null,
            type: cc.Label,
        },
        displayType: {
            default: null,
            type: cc.Label,
        },
        displayCount: {
            default: null,
            type: NumericLabel,
        },
        raritySelector: {
            default: null,
            type: NodeSelector,
            tooltip: "(optional) Hook up for displaying rarity. Nodes are ordered from Common-Legendary (0-4)"
        },
        viewGroup: {
            default: 0,
            type: cc.Integer,
            tooltip: "Used by external compoents for views that might share the same real estate.  Non 0 values add views to the same group.  Only 1 view from a group should be active at a time",
        },
    },

    setItemModel(itemModel) {
        if (!(itemModel instanceof PremiumItemModel)) {
            this.log.e('Invalid item model: ' + JSON.stringify(itemModel));
            return;
        }
        this._itemModel = itemModel;
        return itemModel.loadConfig()
        .then(() => {
            this._reset();
            const loadingPromises = [];
            const type = itemModel.get('type');
            if (AVATAR_DISPLAY_TYPES.indexOf(type) !== -1) {
                loadingPromises.push(this._setupAvatar());
            }

            const displayName = itemModel.getClientConfigValue('displayName');
            if (displayName && this.displayName) {
                this.displayName.string = displayName;
            }

            const displayType = itemModel.get('displayType');
            if (displayType && this.displayType) {
                this.displayType.string = displayType;
            }

            if (this.displayCount) {
                this.displayCount.setNumber(itemModel.get('count'));
            }

            if (this.raritySelector) {
                const rarity = itemModel.getClientConfigValue('rarity', 0);
                if (rarity > 0) {
                    this.raritySelector.selectNode(rarity - 1);
                    this.raritySelector.node.active = true;
                } else {
                    this.raritySelector.node.active = false;
                    this.log.d('Unsupported rarity value for item: ' + rarity + '; ' + itemModel.getCompoundID());
                }
            }

            if (SPINE_DISPLAY_TYPES.indexOf(type) !== -1) {
                loadingPromises.push(this._setupSpine(itemModel));
            } else {
                loadingPromises.push(this._setupImage(itemModel));
            }
        });
    },

    acceptsRewardType(type) {
        return (this.itemType === PremiumItemType.generic || this.itemType === PremiumItemType[type]);
    },

    _setupImage(itemModel) {
        if (!this.imageLoader) {
            return Promise.resolve();
        }
        const success = itemModel.setupImageLoader(this.imageLoader, this.imageName);
        if (!success) {
            this.log.e('Failed to setup image for ' + itemModel.getCompoundID());
            return Promise.resolve();
        }
        this.imageLoader.node.active = true;
        this.imageLoader.loadImageAsset();
        return this.imageLoader.getAssetLoadingPromise();
    },

    _setupSpine(itemModel) {
        if (!this.spineLoader) {
            return Promise.resolve();
        }
        const success = itemModel.setupSpineLoader(this.spineLoader, this.spineName);
        if (!success) {
            this.log.e('Failed to setup spine for ' + itemModel.getCompoundID());
            return Promise.resolve();
        }
        this.spineLoader.node.active = true;
        this.spineLoader.loadSpineAsset();
        return this.spineLoader.getAssetLoadingPromise();
    },

    _setupAvatar() {
        if (!this.avatarImage) {
            return Promise.resolve();
        }
        this.avatarImage.node.active = true;
        const characterID = CasinoCharacterService.playerCharacter.getCharacterID();
        return CasinoCharacterService.getCharacterAvatarURLs(characterID).bind(this)
        .then(function(result) {
            const ANON_AVATAR_IMAGE = 'clubs___images___bonus___anonymousAvatar.png';
            this.avatarImage.imageName = result.avatarNeutral.url ? result.avatarNeutral.url : ANON_AVATAR_IMAGE;
            this.avatarImage.loadImageAsset();
            return this.avatarImage.getAssetLoadingPromise();
        });
    },

    _reset() {
        if (this.imageLoader) {
            this.imageLoader.node.active = false;
        }
        if (this.spineLoader) {
            this.spineLoader.node.active = false;
        }
        if (this.avatarImage) {
            this.avatarImage.node.active = false;
        }
        if (this.displayName) {
            this.displayName.string = '';
        }
        if (this.displayType) {
            this.displayType.string = '';
        }
        if (this.displayCount) {
            const countNode = this.displayCount.hideNode || this.displayCount.node;
            countNode.active = false;
        }
        if (this.raritySelector) {
            this.raritySelector.node.active = false;
        }
    },
});
