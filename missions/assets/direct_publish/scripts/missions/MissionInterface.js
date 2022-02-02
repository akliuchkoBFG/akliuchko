const BaseMissionInterface = require('BaseMissionInterface');
const MissionDataProvider = require('MissionDataProvider');
const MissionDataProviderLoadData = require('MissionDataProviderLoadData');

const TAG = "missionInterface";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: BaseMissionInterface,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Missions/Core/Mission Interface',
		executeInEditMode: true,
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/495616500/Mission+Interface'
	},

	properties: {
		missionDataProvider: {
			default: null,
			type: MissionDataProvider,
			tooltip: "Reference to the missions data provider (defaults to use MissionDataProviderLoadData on the root)",
			notify: function(prevDataProvider) {
				if (CC_EDITOR && prevDataProvider !== this.missionDataProvider) {
					// we don't want to use load data... remove the component
					if (prevDataProvider) {
						Editor.w("Previous Mission Data Provider " + prevDataProvider.name + " has been removed");
						prevDataProvider.destroy();
					}
				}
			}
		},

		missionDataIndex: {
			default: 0,
			displayName: "Mission Data Index",
			tooltip: "Index of the mission data this interface uses when supporting multiple missions (defaults to 0)",
		},
	},

	onLoad: function() {
		this._isInitialized = false;
		this._stepData = {};

		SANotificationCenter.getInstance().postNotification('InitializeProgressUI');

		if (CC_EDITOR) {
			this.findOrAddDataProvider();
		} else {
			this.retrieveDataFromProvider();
		}
	},

	isInitialized: function() {
		return this._isInitialized;
	},

	findOrAddDataProvider: function() {
		if (CC_EDITOR) {
			if (!this.missionDataProvider) {
				let node = this.node;
				while (node) {
					const dataProvider = node.getComponent(MissionDataProvider);
					if (dataProvider) {
						this.missionDataProvider = dataProvider;
						break;
					} else {
						const parent = node.getParent();
						// if we are at the top level node with no provider... add load data as as the default
						if (parent instanceof cc.Scene || !parent) {
							const loadData = node.addComponent(MissionDataProviderLoadData);
							this.missionDataProvider = loadData;
							break;
						} else {
							node = parent;
						}
					}
				}
			}
		}
	},

	retrieveDataFromProvider() {
		if (!CC_EDITOR && this.missionDataProvider) {
			this.missionDataProvider.getMissionData(this.missionDataIndex).then((data) => {
				if (data) {
					this.updateMissionDataWithNotice(data);
				}
			});
		}
	},

	updateMissionData(missionData) {
		// 	create instances of step
		this._stepData = {};
		this._missionData = missionData;
		if (this._missionData && 
			this._missionData.mission && 
			this._missionData.mission.stepsNetworkData &&
			this._missionData.mission.stepsNetworkData.data) {
			this._isInitialized = true;
			this._updateStepData(this._missionData.mission.stepsNetworkData.data);
		} else {
			this.log.e("Step Data Not Found For Mission");
		}
	},

	updateMissionDataWithNotice(missionData) {
		this.updateMissionData(missionData);
		this.triggerMissionUpdateNotice();
	},

	triggerMissionUpdateNotice() {
		this.emit('updateMissionDataEvent', null);
	},

	_updateStepData(stepData) {
		stepData.forEach((step) => {
			// TODO: consider if the direct reference is ok, or if we should copy and refresh on change
			this._stepData[step.data.id] = step;
		});
	},

	getStepData: function(stepID) {
		if (this._stepData[stepID]) {
			return this._stepData[stepID];
		} else {
			this.log.e("Step Data Not Found for id: " + stepID);
		}
		return null;
	},

	getAllStepIDs: function() {
		return _.sortBy(Object.keys(this._stepData), (id) => +id);
	},

	updateProgressForStep: function(stepID, stepProgress) {
		if (this._stepData[stepID]) {
			var boundedProgress = Math.min(this._stepData[stepID].data.max, stepProgress);
			this._stepData[stepID].data.progress = boundedProgress;
		}
	},

	updateProgressForStepWithNotice: function(stepID, stepProgress) {
		this.updateProgressForStep(stepID, stepProgress);
		this.triggerMissionUpdateNotice();
	},

	updateStepStateWithNotice: function(stepID, stepState) {
		if (this._stepData[stepID]) {
			this._stepData[stepID].data.state = stepState;
			this.triggerMissionUpdateNotice();
		}
	},

	markStepAsAwarded: function(stepID) {
		if (this._stepData[stepID]) {
			this._stepData[stepID].data.awarded = true;
		}
	},

	markMissionAwarded: function(){
		this._missionData.mission.awarded = true;
	},

	getStepProgress: function(stepIndex) {
		if(this._stepData && this._stepData[stepIndex]) {
			return this._stepData[stepIndex].data.progress; 	
		}
		return 0;
	},

	isSequential: function() {
		if (this._missionData &&
			this._missionData.mission &&
			this._missionData.mission.stepsNetworkData &&
			this._missionData.mission.stepsNetworkData.graph &&
			this._missionData.mission.stepsNetworkData.graph.type) {
			if (this._missionData.mission.stepsNetworkData.graph.type === "sequential") {
				return true;
			}
		} else {
			this.log.e("stepsNetworkData data not found");
		}
		return false;
	},

	isAllStepsComplete: function() {
		let allStepsComplete = true;
		_(this._stepData).forOwn((step, id) => {
			// TODO: may change this to use mission state data
			if (!step.data || !step.data.awarded) {
				allStepsComplete = false;
				return false;
			}
		});
		return allStepsComplete;
	},

	
	isMissionFinished: function() {
		//On instantiation, the missionData may not be initialized.
		//Only check mission.awarded if the mission type has a mission level award, otherwise ignore it.
		return this.isAllStepsComplete() && ((!!this._missionData.mission.awardData && this._missionData.mission.awarded) || (!this._missionData.mission.awardData ));
	},
	

	getActiveStepIDs: function() {
		// TODO: handle mission complete state
		let activeStepIDs = [];
		const isSequential = this.isSequential();
		_(this._stepData).forOwn((step, id) => {
			// states: locked | active | complete | redeemed
			if (step.data.state !== 'locked' && step.data.state !== 'redeemed') {
				if (isSequential) {
					// only send one step if sequential, 
					// keep overwriting until we get to the last one
					activeStepIDs = [id];
				} else {
					activeStepIDs.push(id);
				}
			}
		});
		// TODO: refreshing a template in the editor is giving me old data if i've retrieved it once
		// may need to hack this for some testing
		return activeStepIDs;
	},

	getStepIDsByState: function(state) {
		return _(this._stepData)
		.filter({
			data: {state}
		})
		.map((stepData) => {
			// String cast for consistency with other methods that return stepIDs
			return "" + stepData.data.id;
		})
		.value();
	},

	getFinalStepID: function() {
		let lastFoundID = 0;
		_(this._stepData).forOwn((step, id) => {
			lastFoundID = id;
		});
		return lastFoundID;
	},

	getTemplateID: function() {
		return this._missionData && this._missionData.templateID;
	},

	getMissionID: function() {
		return this._missionData && this._missionData.id;
	},

	getSecondsActive: function() {
		return this._missionData && this._missionData.secondsActive;
	},

	getSecondsRemaining: function() {
		return this._missionData && this._missionData.secondsRemaining;
	},

	getGiftsData: function() {
		return this._missionData && this._missionData.giftsData;
	},

	getManifestEntry: function(manifestKey) {
		let entry = null;
		if (this._missionData && this._missionData.mission.manifest) {
			entry = this._missionData.mission.manifest[manifestKey];
		}
		return entry;
	},

	getTrayIcon() {
		let iconName = '';
		// Check in the mission data manifest for the icon image
		// The manifest may be empty and this._missionData.mission.manifest.tray_icon can be an empty string or undefined
		iconName = this.getManifestEntry('tray_icon') || '';
		if (iconName) {
			return Promise.resolve(iconName);
		}
		const tags = this.getTags();
		if (tags.length === 0) {
			return Promise.resolve(iconName);
		}
		const ICON_IDENTIFIER = 'icon.';
		tags.forEach((tag) => {
			if (tag.indexOf(ICON_IDENTIFIER) === 0) {
				iconName = tag.replace(ICON_IDENTIFIER, '');
			}
		});
		if (!iconName) {
			return Promise.resolve('');
		}
		const configLoader = PremiumItemModel.createWithData({
			type: 'asset',
			group: 'mission_icons_temp',
			name: iconName,
		});
		return configLoader.loadConfig()
		.then(() => {
			return configLoader.getClientConfigValue('images.asset');
		});
	},

	// Get mission popup, optionally providing input popup data sourced from a promotion layout
	getMainPopup(promoPopup) {
		if (promoPopup && promoPopup.name) {
			// Input promo popup takes priority over manifest.main_popup until we have tools to edit a live mission template version
			// See SCX-3238 for tooling ticket status
			return promoPopup;
		} else {
			const popup = this.getManifestEntry('main_popup');
			return popup;
		}
	},

	getTags: function() {
		if (!this._missionData) {
			return [];
		}
		return this._missionData.tags;
	},

	isMissionAwardClaimed: function() {
		if (this._missionData && this._missionData.mission) {
			if (!this._missionData.mission.awardData) {
				// If no mission award exists, return true
				return true;
			}
			return this._missionData.mission.awarded;
		}
	},

	claimMissionAward: function() {
		const comboID = CasinoCharacterService.playerCharacter.getComboID();
		const missionID = this.getMissionID();
		const type = 'player';  // default type for missions
		const params = [comboID, type, missionID];

		return SANetworkInterface.serverRequest({
			controller: 'mission',
			method: 'awardMission',
			params: params,
			encoding: 'Params',
		}).then((result) => {
			if (result.missionData) {
				this._stepData = {};
				// TODO: the server will only ever return a single item array, should we fix this?
				// var boundedIndex = Math.max(0, Math.min(this.missionDataIndex, result.missionData.length-1));
				this.updateMissionData(result.missionData[0]);
			}
			// Send notice that claim request was completed
			this.emit('claimedMissionAward', {});
			SANotificationCenter.getInstance().postNotification('lobby.shouldRequestLobbyData');

		}).catch((error) => {
			this.log.e('ClaimMissionAward failed, ' + error);
		});
	},

	claimStepAward: function(stepID) {
		const comboID = CasinoCharacterService.playerCharacter.getComboID();
		const missionID = this.getMissionID();
		const type = 'player';  // default type for missions
		const params = [comboID, type, missionID, stepID];
		
		return SANetworkInterface.serverRequest({
			controller: 'mission',
			method: 'awardStep',
			params: params,
			encoding: 'Params',
		}).bind(this).then(function(result) {
			// Use the data returned to update missionData
			if (result.missionData) {
				this._stepData = {};
				// TODO: the server will only ever return a single item array, should we fix this?
				// var boundedIndex = Math.max(0, Math.min(this.missionDataIndex, result.missionData.length-1));
				this.updateMissionData(result.missionData[0]);
			}
			// Send notice that claim request was completed
			this.emit('claimedStepAward', {
				stepID,
			});
			
			SANotificationCenter.getInstance().postNotification('lobby.shouldRequestLobbyData');
		}).catch(function(error) {
			this.log.e('ClaimStepAward failed, ' + error);
		});
	},

	onStepComplete: function() {
		if (this.isSequential()) {
			// Trigger a data update for all MissionStepInterfaces and components
			this.triggerMissionUpdateNotice();
		} // Allow non-sequential step graphs more control over when mission data updates
	},

	onCommandComplete: function() {
		// Trigger a data update for all MissionStepInterfaces and components
		this.triggerMissionUpdateNotice();
	},

	getSlotData: function(buyInID) {
		if (this._missionData && this._missionData.slotsData) {
			return this._missionData.slotsData[buyInID];
		}
	},

	getAwardData: function() {
		return this._missionData && this._missionData.mission && this._missionData.mission.awardData;
	},
	getAwardResultData: function() {
		return this._missionData && this._missionData.mission && this._missionData.mission.awardResult;
	},

	getAnyStepClaimable: function(){
		const claimableSteps = [];
		const stepData = this._stepData;
		
		const stepDataArray = Object.keys(stepData).map((index) => {
			return stepData[index];
		});
		
		stepDataArray.forEach((step) => {
			const max = step.data.max || 1;
			const newProgress = step.data.progress || 0;
			const stepAwarded = step.data.awarded || false;
			if(newProgress >= max && !stepAwarded){
				claimableSteps.push(step);
			}
		});
		return claimableSteps;
	},

	// Command Data //

	// get a copy of the command data
	getPublicCommandData: function() {
		const commandData = this._missionData.mission.commandData;
		let publicData = commandData.public || {};
		publicData = Object.assign({}, publicData);

		return publicData;
	},

	// sets a local copy of the command data, send an event to notify other components
	setPublicCommandData: function(data, notify) {
		this._missionData.mission.commandData.public = data;
		if (notify) {
			this.emit('publicCommandDataUpdated', data);
		}
	},

	// update specific fields in the local copy of the command data, send an event to notify other components
	updatePublicCommandData: function(data, notify) {
		const publicData = this.getPublicCommandData();
		_.forOwn(data, (value, key) => {
			publicData[key] = value;
		});
		
		this.setPublicCommandData(publicData, notify);
		return publicData;
	},

	getMissionCommandData: function (missionKey) {
		const commandData = this._missionData.mission.commandData || {};
		const missionData = commandData[missionKey];
		if (!missionData) {
			this.log.e("No mission command data found for " + missionKey);
		}

		return _.assign({}, missionData);
	},

	// send the public command data to the server, saving it to the mission data
	sendPublicCommandData: function(data, notify) {
		return this.callCommand("updatePublicCommandData", data, notify);
	},

	// call a specific command, notify to update components on return
	callCommand: function(command, data, notify) {
		const comboID = CasinoCharacterService.playerCharacter.getComboID();
		const missionID = this.getMissionID();

		// this returns a few peices of data...
		return SANetworkInterface.serverRequest({
			controller: "mission",
			method: "processCommand",
			params: [comboID, missionID],
			postObject: {
				commandData: {
					command: command,
					args: data,
				}
			},
		}).then((result) => {
			if (result.missionData) {
				if (notify) {
					this.updateMissionDataWithNotice(result.missionData);
				} else {
					this.updateMissionData(result.missionData);
				}
			} else {
				// TODO: error
			}
			return result;
		});
	},

	// ClientSide Metrics
	sendMetricsEvent: function(name, data) {
		const jsonData = Object.assign({}, data);
		jsonData.missionID = this._missionData.id;
		jsonData.templateID = this._missionData.templateID;
		jsonData.tags = this._missionData.tags;

		SAMetrics.sendEvent({eventName: name, st1: 'missions', jsonData: jsonData});
	}
});