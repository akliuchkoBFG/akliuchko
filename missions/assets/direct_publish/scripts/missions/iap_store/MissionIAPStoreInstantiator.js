// This is the main component for integrating IAP into any mission.
// It is responsible for showing/hiding the button based on IAP data and constructing the main store popup with themed elements

const BaseMissionComponent = require("BaseMissionComponent");
const CountdownComponent = require("CountdownComponent");

const TAG = "MissionIAPInstantior";
const ComponentLog = require('ComponentSALog')(TAG);

const MIN_STORE_TIME = 300; // The mission needs at least 5 minutes for purchases to be enabled

cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog],

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

		// prefab? (or scene?)
		storePrefab: {
			default: null,
			type: cc.Prefab,
			tooltip: "Main store layout prefab"
		},

		storeLogoSprite: {
			default: null,
			type: cc.SpriteFrame,
			tooltip: "Sprite for the store's main logo"
		},

		storeItemPrefab: {
			default: null,
			type: cc.Prefab,
			tootip: "Prefab used for all each store item"
		},

		storeItemIcon: {
			default: null,
			type: cc.SpriteFrame,
			tooltip: "Icon for the item(s) we are selling"
		},

		storeItemTierIcons: {
			default: [],
			type: [cc.SpriteFrame],
			tooltip: "Icons for each package teir"
		},

		storeParent: {
			default: null,
			type: cc.Node,
			tooltip: "Parent node to attach the store popup when opened"
		},

		storeButton: {
			default: null,
			type: cc.Button,
			tooltip: "Button used to open the store popup"
		},

		missionTimer: {
			default: null,
			type: CountdownComponent,
			tooltip: "Mission timer to sync the store timer with"
		},

		buyNowSprite: {
			default: null,
			type: cc.SpriteFrame,
			tooltip: "Sprite containg the Buy Now text"
		},

		warningText: {
			default: "* You must use any bought currency before the end of the mission.  Any unused currency will be lost.",
			// type: cc.String,
			multiline: true,
			tooltip: "Text informing the user about the timer"
		},

		metricsEventDataComponent: {
			default: null,
			type: cc.Node,
			tooltip: "Provide a getMetricsEventData() function on this component to return specific for metric events.  Default data will be defined if none is provided"
		},
	},

	// use this for initialization
	onLoad: function () {
		this._super();

		// hide button
		this.storeButton.node.active = false;

	},

	start: function() {
		if (!this.storeParent) {
			this.storeParent = this;
			this.log.w("Store Parent defaulting to node parent " + this.node);
		}
	},

	onUpdateMissionData: function() {
		this._checkForAndActivateIAP();
	},

	onOpenStore: function() {
		if (this.storePrefab && this.storeItemPrefab) {

			this._getMissionIapData().then((iapData) => {
				this._launchStorePopup(iapData);
			});

		} else {
			this.log.e("No Store Prefab(s) Found");
		}

	},

	onCloseStore: function() {
		if (this.storePopup) {
			this.storePopup.removeFromParent();
			this.storePopup = null;
		}
	},

	_getMissionIapData: function() {

		const comboID = CasinoCharacterService.playerCharacter.getComboID();
		const templateID = this.missionInterface.getTemplateID();

		return SANetworkInterface.serverRequest({
			controller: "mission_iap",
			method: "getPurchaseData",
			params: [comboID, templateID],
		}).then((result) => {
			return this._formatIAPData(result, templateID);
		});
	},

	_launchStorePopup: function(iapData) {
		if (!iapData) {
			this.log.e("No IAP Data retrieved");
			return; 
		}

		if (!this._checkForAndActivateIAP()) {
			return;
		}

		this.storePopup = cc.instantiate(this.storePrefab);
		const storeVC = this.storePopup.getComponent("MissionIAPStoreViewController");
		if (storeVC) {

			// set the iap data
			storeVC.setIAPData(iapData);

			// set the item prefabs
			storeVC.setStoreItemPrefab(this.storeItemPrefab);
			storeVC.setStoreItemIcon(this.storeItemIcon);
			storeVC.setStoreItemTeirIcons(this.storeItemTierIcons);

			// set the store logo
			if (this.storeLogoSprite) {
				storeVC.setLogoSprite(this.storeLogoSprite);
			}

			// send timer
			if (this.missionTimer) {
				storeVC.setTimer(this.missionTimer.getTimeRemaining());
			}

			// set themed text
			if (this.buyNowSprite) {
				storeVC.setBuyNowSprite(this.buyNowSprite);
			}
			if (this.warningText) {
				storeVC.setWarningText(this.warningText);
			}

			// finish setting up the popup
			storeVC.buildPopup();

			this.storeParent.addChild(this.storePopup);

			// bind success events
			const itemVCs = this.storePopup.getComponentsInChildren("MissionIAPStoreItemViewController");
			itemVCs.forEach((itemVC) => {
				itemVC.on("purchaseSuccess", (event) => {
					this._refreshMissionData();
					this.onCloseStore();
				});
			});

			this._sendMetircsEventOpenStore();

		} else {
			this.log.e("No ViewController found on Store popup ");
		}
	},

	_checkForAndActivateIAP: function() {
		let secondsRemaining = this.missionInterface.getSecondsRemaining();
		if (this.missionTimer) {
			// The client will be more accurate at this point
			secondsRemaining = Math.min(secondsRemaining, this.missionTimer.getTimeRemaining() / 1000);
		};

		const active = 
			!_.isEmpty(this.missionInterface.getMissionIapData()) &&
			secondsRemaining > MIN_STORE_TIME;

		this.storeButton.node.active = active;

		return active;
	},

	_formatIAPData(purchaseData, templateID) {
		let iapData = [];
		_.forOwn(purchaseData, (data, price) => {
			iapData.push({
				sku: data.productID,
				price: price,
				awards: data.productPackageInfo,
				templateID: templateID,
				vipPoints: data.vipPoints,
			});
		});
		return iapData;
	},

	_refreshMissionData: function() {
		const comboID = CasinoCharacterService.playerCharacter.getComboID();
		const missionID = this.missionInterface.getMissionID();
		const params = [comboID, missionID];
		SANetworkInterface.serverRequest({
			controller: 'mission',
			method: 'getPlayerMissionData',
			params: params,
			encoding: 'Params',
		}).then((data) => {
			if(data.missionData && data.missionData[0]){
				this.missionInterface.updateMissionDataWithNotice(data.missionData[0]);
			}
		});
	},

	_sendMetircsEventOpenStore: function() {
		const data = this._getMetricsEventData();
		this.missionInterface.sendMetricsEvent("mission_iap_opened", data);
	},

	_getMetricsEventData: function() {
		let data = this.getMetricsEventData();
		if (this.metricsEventDataComponent) {
			const components = this.metricsEventDataComponent._components;
			components.forEach((component) => {
				if (component.getMetricsEventData) {
					data = Object.assign(data, component.getMetricsEventData());
				}
			});
		}

		return data;
	},

	getMetricsEventData: function() {
		const activeStepIDs = this.missionInterface.getActiveStepIDs();
		let stepID = -1;
		if (activeStepIDs.length) {
			stepID = activeStepIDs[0];
		}
		const data = {
			stepID: stepID,
		};
		return data;
	},
});