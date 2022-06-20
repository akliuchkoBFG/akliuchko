const TAG = "MissionIAPStoreViewController";
const ComponentLog = require('ComponentSALog')(TAG);

const CountdownComponent = require('CountdownComponent');

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog, cc.EventTarget],

	properties: {
		// foo: {
		//    default: null,      // The default value will be used only when the component attaching
		//                           to a node for the first time
		//    url: cc.Texture2D,  // optional, default is typeof default
		//    serializable: true, // optional, default is true
		//    visible: true,      // optional, default is true
		//    displayName: 'Foo', // optional
		//    readonly: false,    // optional, default is false
		// },
		// ...

		itemsLayout: {
			default: null,
			type: cc.Node,
			tooltip: "Layout component where store items will be added to"
		},

		timer: {
			default: null,
			type: CountdownComponent,
			tooltip: "Timer in sync with the mission popup"
		},

		logoSprite: {
			default: null,
			type: cc.Sprite,
			tooltip: ""
		},

		buyNowSprite: {
			default: null,
			type: cc.Sprite,
			tooltip: "Text node informing the user what they are buying"
		},

		warningText: {
			default: null,
			type: cc.RichText,
			tooltip: "Text node warning the user about the expiring time"
		},

		confirmPopupNode: {
			default: null,
			type: cc.Node,
			tooltip: "Node for the confermation popup",
		},
	},

	// use this for initialization
	onLoad: function () {
		if (this.confirmPopupNode) {
			this.confirmPopupNode.active = false;
		} else {
			this.log.w("No confirmation popup node defined");
		}
	},

	setStoreItemPrefab: function (prefab) {
		this._storeItemPrefab = prefab;
	},

	setStoreItemIcon: function(icon) {
		this._storeItemIcon = icon;
	},

	setStoreItemTeirIcons: function(tierIcons) {
		this._storeItemTierIcons = tierIcons;
	},

	setLogoSprite: function(logo) {
		if (this.logoSprite) {
			this.logoSprite.spriteFrame = logo;
		} else {
			this.log.w("No logo sprite defined");
		}
	},

	setIAPData: function(iapData) {
		this._iapData = iapData;
	},

	setTimer: function(duration) {
		if (this.timer) {
			this.timer.setDuration(duration);
		} else {
			this.log.w("No timer defined");
		}
	},

	setBuyNowSprite: function(sprite) {
		if (this.buyNowSprite) {
			this.buyNowSprite.spriteFrame = sprite;
		} else {
			this.log.w("No BuyNow text node defined");
		}
	},

	setWarningText: function(string) {
		if (this.warningText) {
			this.warningText.string = string;
		} else {
			this.log.w("No Warning text node defined");
		}
	},

	buildPopup: function() {

		if (!this.itemsLayout) {
			this.log.e("Missing Store Items Layout");
		}

		// get IAPS
		this._iapData.forEach((iapData, index) => {
			this._addStoreItem(iapData, index);
		});

	},

	_addStoreItem(iapData, index) {
		const itemNode = cc.instantiate(this._storeItemPrefab);
		const itemVC = itemNode.getComponent("MissionIAPStoreItemViewController");
		if (itemVC) {
			itemVC.setIAPData(iapData);
			if (this._storeItemIcon) {
				itemVC.setIcon(this._storeItemIcon);
			}
			if (this._storeItemTierIcons) {
				if (this._storeItemTierIcons[index]) {
					itemVC.setTierIcon(this._storeItemTierIcons[index]);
				} else {
					itemVC.setTierIcon(this._storeItemTierIcons[0]);
				}
			}

			itemVC.setConfirmPopupNodeReference(this.confirmPopupNode);

			this.itemsLayout.addChild(itemNode);
		} else {
			this.log.e("No MissionIAPStoreItemViewController found on prefab");
		}
	},

	onClosePopup: function() {
		//this.emit('closePopup'); // do I need this?

		this.node.removeFromParent();
	}
});
