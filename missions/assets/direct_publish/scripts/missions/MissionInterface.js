const BaseMissionInterface = require('BaseMissionInterface');
const MissionDataProvider = require('MissionDataProvider');
const MissionDataProviderLoadData = require('MissionDataProviderLoadData');

const TAG = "missionInterface";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: BaseMissionInterface,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Mission Interface',
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

	updateProgressForStep: function(stepID, stepProgress) {
		if(this._stepData[stepID])
		{
			var boundedProgress = Math.min(this._stepData[stepID].data.max,stepProgress);
			this._stepData[stepID].data.progress = boundedProgress;
		}
	},

	updateProgressForStepWithNotice: function(stepID, stepProgress) {
		this.updateProgressForStep(stepID, stepProgress);
		this.emit('updateMissionDataEvent', null);
	},

	updateStepStateWithNotice: function(stepID, stepState) {
		if (this._stepData[stepID]) {
			this._stepData[stepID].data.state = stepState;
			this.emit('updateMissionDataEvent', null);
		}
	},

	markStepAsAwarded: function(stepID) {
		if (this._stepData[stepID]) {
			this._stepData[stepID].data.awarded = true;
		}
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

	getSecondsRemaining: function() {
		return this._missionData && this._missionData.secondsRemaining;
	},

	getGiftsData: function() {
		return this._missionData && this._missionData.giftsData;
	},

	getTrayIcon() {
		let iconName = '';
		if (!this._missionData) {
			return Promise.resolve(iconName);
		}
		const tags = this._missionData.tags;
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
			this.emit('claimedStepAward', {});
			
			SANotificationCenter.getInstance().postNotification('lobby.shouldRequestLobbyData');
		}).catch(function(error) {
			this.log.e('ClaimStepAward failed, ' + error);
		});
	},

	onStepComplete: function() {
		// Trigger a data update for all MissionStepInterfaces and components
		this.emit('updateMissionDataEvent', null);
	},

	getSlotData: function(buyInID) {
		if (this._missionData && this._missionData.slotsData) {
			return this._missionData.slotsData[buyInID];
		}
	}
});