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
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SPP/pages/495452795/Mission+Step+Interface'
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

		if (CC_EDITOR) {
			this.missionInterface = this.missionInterface || MissionInterface.findInterfaceInScene(this);
		}

		this.missionInterface.on('updateMissionDataEvent', this.reloadStepData, this);
	},

	isInitialized: function() {
		return this._isInitialized;
	},

	reloadStepData: function() {
		if (this.missionInterface) {
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
		this.missionInterface.claimStepAward(this.stepID);
	},

	launchSlot: function(buyInID) {
        const slotData = this.getSlotData(buyInID);
        
        if (!slotData || !slotData.customData) {
        	this.log.e('Template does not contain slot information for buyInID ' + buyInID + ' cannot launch slot');
        	SADispatchObject.performAction('close', {});
        } else {
        	SADispatchObject.performAction('launchSlots', slotData.customData);
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

	getBuyInIDs: function() {
		return this._stepData && this._stepData.data && this._stepData.data.buyInIDs;
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

	getState: function() {
		return this._stepData && this._stepData.data && this._stepData.data.state;
	},
});
