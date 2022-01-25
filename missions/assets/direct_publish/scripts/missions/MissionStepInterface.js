const BaseMissionInterface = require('BaseMissionInterface');
const MissionInterface = require('MissionInterface');

const TAG = "missionStepInterface";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: BaseMissionInterface,
	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Mission Step Interface',
		executeInEditMode: true,
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/495452795/Mission+Step+Interface'
	},

	properties: {
		missionInterface: {
			default: null,
			type: MissionInterface,
			tooltip: "Step Interfaces require a top level Mission Interface to access Mission and Step data"
		},

		stepID: {
			default: 0,
			tooltip: "The Step ID of the corresponding step data components will access",
			visible: function() { return !this.useActiveStepIDOnly; },
			notify: function(oldVal) {
				if (this.stepID !== oldVal) {
					if(this.missionInterface) {
						this.reloadStepData();
					}
				}
			}
		},

		dependentSteps: {
			default: [],
			type: [cc.Integer],
			tooltip: "The Step IDs of the steps that require this one to be complete/claimed to unlock",
			visible: function() { return !this.useActiveStepIDOnly; }
		},

		predecessorSteps: {
			default: [],
			type: [cc.Integer],
			tooltip: "The Step IDs of the steps this one requires to be complete/claimed to unlock",
			visible: function() { return !this.useActiveStepIDOnly; }
		},

		useActiveStepIDOnly: {
			default: false,
			tooltip: "If only the active step is meant to be viewed, only one missionStepInterface is required.  Toggling this will ensure it always accesses the active data"
		},
	},

	// use this for initialization
	onLoad: function () {
		this._isInitialized = false;

		this._stepData = null;

		this.missionInterface = this.missionInterface || MissionInterface.findInterfaceInScene(this, 'MissionInterface');

		if (this.missionInterface) {
			this.missionInterface.on('updateMissionDataEvent', this.reloadStepData, this);
		}
	},

	start: function() {
		if (!this._isInitialized) {
			this.reloadStepData();
		}
	},

	isInitialized: function() {
		return this._isInitialized;
	},

	reloadStepData: function() {
		if (this.missionInterface) {
			if (this.missionInterface.isInitialized()) {
				if (this.useActiveStepIDOnly) {
					const activeStepIDs = this.missionInterface.getActiveStepIDs();
					if (activeStepIDs.length === 1) {
						this.stepID = activeStepIDs[0];
					} else if (activeStepIDs.length === 0) {
						this.stepID = this.missionInterface.getFinalStepID();
					} else {
						this.log.e("Found too many active steps.");
					}
				}
				this._updateStepData();
				this._isInitialized = true;
				this.emit('updateMissionStepDataEvent', null);
			}
		} else {
			this.log.e("Mission Interface Not Found");
		}
	},

	_updateStepData: function() {
		this._stepData = this.missionInterface.getStepData(this.stepID);
		if (this._stepData) {
			this.dependentSteps = this._stepData.data.edges;
			this.predecessorSteps = this._stepData.data.predecessors;
		}
	},

	claimAward: function() {
		return this.missionInterface.claimStepAward(this.stepID);
	},

	launchSlot: function(buyInID) {
		if (buyInID) {
			const slotData = this.getSlotData(buyInID);
			if (slotData) {
				if (Game.getGameContextController) {
					Game.getGameContextController().launchSlot(slotData.customData);
				} else {
					SADispatchObject.performAction('launchSlots', slotData.customData);
				}
			} else {
				this.log.w('Template does not contain slot information for buyInID: ' + buyInID);
			}
		}
	},

	onStepComplete: function() {
		// TODO: Notify MissionInterface to refresh current step state
		this.missionInterface.onStepComplete();
	},

	// getters
	getMissionID: function() {
		return this.missionInterface.getMissionID();
	},

	getStepClass: function() {
		return this._stepData && this._stepData.class;
	},

	getProgressAmount: function() {
		return this._stepData && this._stepData.data && this._stepData.data.progress;
	},

	getProgressMax: function() {
		return this._stepData && this._stepData.data && parseInt(this._stepData.data.max, 10);
	},

	getAwardData: function() {
		return this._stepData && this._stepData.data && this._stepData.data.award;
	},

	getAwarded: function() {
		return this._stepData && this._stepData.data && this._stepData.data.awarded;
	},

	getAwardResultData: function() {
		// the data might have been updated, but not progigated to this interface yet, 
		// ...so call an update
		this._updateStepData();
		return this._stepData && this._stepData.data && this._stepData.data.awardResult;
	},

	getBuyInIDs: function() {
		return this._stepData && this._stepData.data && this._stepData.data.buyInIDs || [];
	},

	getGiftIDs: function() {
		return this._stepData && this._stepData.data && this._stepData.data.giftIDs;
	},

	getSlotData: function(buyInID) {
		return this.missionInterface.getSlotData(buyInID);
	},

	getFormatString: function() {
		return this._stepData && this._stepData.data && this._stepData.data.formatString;
	},

	getMinBet: function() {
		return this._stepData && this._stepData.data && this._stepData.data.minBet;
	},

	getThreshold: function() {
		return this._stepData && this._stepData.data && this._stepData.data.threshold;
	},

	getState: function() {
		return this._stepData && this._stepData.data && this._stepData.data.state;
	},

	// Get the data payload the is used for populating template strings
	getTemplateStringData: function() {
		const slotName = this._getSlotName() || '';
		const giftName = this._getGiftName() || 'gifts';
		const currency = (!CC_EDITOR && Game.isSlotzilla()) ? 'COINS' : 'CHIPS';
		let progress = this.getProgressAmount();
		progress = SAStringUtil.numberAsShortString(progress, '', true);
		let max = this.getProgressMax();
		max = SAStringUtil.numberAsShortString(max, '', true);
		let minBet = this.getMinBet() || 0;
		minBet = SAStringUtil.numberAsShortString(minBet, '', true);
		let threshold = this.getThreshold();
		threshold = SAStringUtil.numberAsShortString(threshold, '', true);
		const chestName = this._getChestName() || '';
		const vault = this._getVault() || '';

		const data = {
			progress: progress,
			max: max,
			slotname: slotName,
			slotnameUpper: slotName.toUpperCase(),
			giftname: giftName,
			minbet: minBet,
			threshold: threshold,
			currencyUpper: currency,
			currencyLower: currency.toLowerCase(),
			templateString: this.getFormatString(),
			chestName: chestName,
			vault: vault,
		};

		return data;
	},

	_getSlotName: function() {
		const buyInIDs = this.getBuyInIDs();
		const slotData = buyInIDs && this.getSlotData(buyInIDs[0]);
		return slotData && slotData.name;
	},

	_getGiftName: function() {
		const giftData = this.missionInterface.getGiftsData();
		const giftIDs = this.getGiftIDs();
		if (giftData && giftIDs) {
			const id = giftIDs[0];
			return giftData[id] && giftData[id].name.toUpperCase();
		}
	},

	_getChestName: function() {
		return this._stepData && this._stepData.data && this._stepData.data.chestName;
	},

	_getVault: function() {
		return this._stepData && this._stepData.data && this._stepData.data.vault;
	},

	getSecondsToUnlock: function getSecondsToUnlock() {
		return this._stepData && this._stepData.data && this._stepData.data.secondsToUnlock;
	},

	getSecondsRemaining: function getSecondsRemaining() {
		return this._stepData && this._stepData.data && this._stepData.data.secondsRemaining;
	},

});
