const TAG = "MissionIAPStoreItemViewController";
const ComponentLog = require('ComponentSALog')(TAG);

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

		iconSprite: {
			default: null,
			type: cc.Sprite
		},

		tierIconSprite: {
			default: null,
			type: cc.Sprite
		},

		amountLabel: {
			default: null,
			type: cc.Label
		},

		priceLabel: {
			default: null,
			type: cc.Label
		},

		vipLabel: {
			default: null,
			type: cc.Label
		},
	},

	// use this for initialization
	onLoad: function () {
		// constructors
	},

	setIcon: function(icon) {
		if (this.iconSprite) {
			this.iconSprite.spriteFrame = icon;
		} else {
			this.log.w("No Icon Sprite defined");
		}
	},

	setTierIcon: function(tierIcon) {
		if (this.tierIconSprite) {
			this.tierIconSprite.spriteFrame = tierIcon;
		} else {
			this.log.w("No Tier Icon Sprite defined");
		}
	},

	setConfirmPopupNodeReference: function(node) {
		this._confirmPopupNode = node;
	},

	setIAPData: function(iapData) {
		/* example iapData
		{
			"sku": "CA.eventitempack_099",
			"price": "0.99",
			"awards": [{
				"data": {
					"amount": 1,
					"duration": "1m",
					"multiplier": 2,
					"order": 2,
					"type": "club_point"
				},
				"type": "ProductPackageItemBooster"
			}, {
				"data": {
					"amount": "10000",
					"order": 1
				},
				"type": "ProductPackageItemChips"
			}, {
				"data": {
					"amount": "1",
					"itemName": "picks",
					"order": 0
				},
				"type": "ProductPackageItemMissionIap"
			}]
		}
		*/
		this._iapData = iapData;

		const missionIapItems = this._iapData.awards.filter(item => (item.type === 'ProductPackageItemMissionIap'));
		if (missionIapItems.length > 0) {
			const item = missionIapItems[0];
			if (this.amountLabel) {
				this.amountLabel.string = `${item.data.amount}`/* ${item.data.itemName}`*/;
			} else {
				this.log.e("No Amount label defined");
			}

			if (this.priceLabel) {
				this.priceLabel.string = "$" + iapData.price;
			} else {
				this.log.e("No Price Label defined");
			}

			if (this.vipLabel) {
				this.vipLabel.string = SAStringUtil.formatNumber(iapData.vipPoints);
			} else {
				this.log.e("No VIP Label defined");
			}
		}

	},

	onPurchase: function() {
		if (this._confirmPopupNode) {
			this._showConfirmPopup();
		} else {
			this._performPurchase();
		}
	},

	onConfirmPurchase: function() {
		if (this._confirmPopupNode) {
			this._confirmPopupNode.active = false;
		}
		// wait a frame so the popup closes beofre the native flow takes over
		//Promise.delay(1).then(() => {
			this._performPurchase();
		//})
	},

	onConfirmCancel: function() {
		if (this._confirmPopupNode) {
			this._confirmPopupNode.active = false;
		}
	},

	_showConfirmPopup: function() {
		const itemVC = this._confirmPopupNode.getComponentsInChildren("MissionIAPStoreItemViewController")[0];
		itemVC.setIcon(this.iconSprite.spriteFrame);
		itemVC.setTierIcon(this.tierIconSprite.spriteFrame);
		itemVC.setIAPData(this._iapData);
		itemVC.setConfirmPopupNodeReference(this._confirmPopupNode);

		this._confirmPopupNode.active = true;
	},

	_performPurchase: function() {
		if (!this._iapData) {
			this.log.e("No IAP Data found");
			return;
		}

		const product = {
			productID: this._iapData.sku,
			templateID: this._iapData.templateID,
		};

		SALog.d("[MissionIap] prepAwardMissionIap: " + JSON.stringify(product), "MissionIap", new Error().stack);
		SANetworkInterface.serverRequest({
			controller: 'mission_iap',
			method: 'prepAwardMissionIap',
			params: [
				CasinoCharacterService.playerCharacter.getComboID(),
				product.templateID,
				product.productID,
			],
		})
		.bind(this)
		.then(function onSuccess(result) {
			var successScreen = {
				gameType: 'casino',
				viewSet: 'store',
				viewName: Game.addLayoutTheme('neon-confirmation'),
			};

			var purchaseData = {
				productID: product.productID,
				successScreen: successScreen
			};

			this.log.d("[MissionIap] performPurchase: " + JSON.stringify(purchaseData), "MissionIap", new Error().stack);

			SAPurchasingUtil.getInstance().performPurchase(purchaseData)
			.bind(this)
			.then((purchase) => {
				this.log.d("[MissionIap] post purchase:" + JSON.stringify(purchase), "MissionIap", new Error().stack);
				this.emit('purchaseSuccess', {purchaseData: purchase});
			})
			.catch((err) => {
				this.log.e("[MissionIap] purchase failed:" + JSON.stringify(err), "MissionIap", new Error().stack);
				if (err === "PurchasingResult.CANCELED") {
					this.log.d("[MissionIap] Purchase canceled by user", "MissionIap", new Error().stack);
				}
			});
		}).catch( function error(e) {
			this.log.e("[MissionIap] prepAwardMissionIap failed:" + JSON.stringify(e), "MissionIap", new Error().stack);
		});
	},
});
