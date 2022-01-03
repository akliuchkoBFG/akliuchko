const BaseMissionComponent = require('BaseMissionComponent');
const TableView = require('TableView');
const DailyMissionStepRewardSequence = require('DailyMissionStepRewardSequence');
const MissionStepCountdownComponent = require('MissionStepCountdownComponent');
const MissionTextConfiguration = require('MissionTextConfiguration');

cc.Class({
	extends: BaseMissionComponent,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Daily/Controller',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		dailyStepTable: {
			default: null,
			type: TableView,
			tooltip: 'Table view for populating individual daily steps',
			notify() {
				this._ensureTableViewPrefab();
			},
		},
		dailyMissionPrefab: {
			default: null,
			type: cc.Prefab,
			tooltip: 'Prefab for a single daily mission row in the daily table view',
			notify() {
				this._ensureTableViewPrefab();
			},
		},
		textConfiguration: {
			default: null,
			type: MissionTextConfiguration,
			tooltip: 'Global text configuration to use with daily mission step prefabs',
		},
		dayCompletePrefab: {
			default: null,
			type: cc.Prefab,
			tooltip: 'Prefab for a module to show at the top of the list when all tasks are complete for the day',
			notify() {
				this._ensureTableViewPrefab();
			},
		},
		dailyCountdown: {
			default: null,
			type: MissionStepCountdownComponent,
			tooltip: 'Step countdown timer for the current day',
		},
		stepRewardSequence: {
			default: null,
			type: DailyMissionStepRewardSequence,
			tooltip: 'Scene reward choreography for claiming an individual daily task',
		},
	},

	onUpdateMissionData() {
		this._populateDailySteps();
	},

	_getStepCell(stepID) {
		if (!this.dailyStepTable) {
			return null;
		}
		const stepCells = this.dailyStepTable.getComponentsInChildren('DailyMissionStepCell');
		const stepCell = _.find(stepCells, (cell) => {
			return +cell.stepInterface.stepID === +stepID;
		});
		return stepCell;
	},

	playStepClaim(stepID) {
		const stepCell = this._getStepCell(stepID);
		if (!stepCell) {
			this.log.e("Missing step cell when trying to play claim for step ID " + stepID);
			return Promise.resolve();
		}

		return stepCell.playClaim();
	},

	getDooberSourceWorldPositionForStep(stepID) {
		const stepCell = this._getStepCell(stepID);
		if (!stepCell) {
			this.log.e("Missing step cell when trying to get doober source position for step ID " + stepID);
			return null;
		}
		return stepCell.getDooberSourceWorldPosition();
	},

	_populateDailySteps() {
		// Don't update list of displayed steps until closing and reopening the popup
		if (this._currentlyDisplayedSteps) {
			return;
		}
		// Get list of steps to show
		let displayedStepIDs = [].concat(
			this.missionInterface.getStepIDsByState('redeemed'),
			this.missionInterface.getStepIDsByState('active'),
			this.missionInterface.getStepIDsByState('complete')
		);

		// Filter for just today's stepIDs
		const activeStepIDs = _.filter(displayedStepIDs, (stepID) => {
			const stepData = this.missionInterface.getStepData(stepID);
			const secondsRemaining = stepData.data.secondsRemaining;
			return secondsRemaining >= 0;
		});

		// Filter to show only current day + unredeemed steps for previous days
		displayedStepIDs = _.filter(displayedStepIDs, (stepID) => {
			const stepData = this.missionInterface.getStepData(stepID);
			if (stepData.data.state === 'redeemed') {
				// Only show redeemed steps for the current day
				const secondsRemaining = stepData.data.secondsRemaining;
				return secondsRemaining > 0;
			} else {
				// Inactive time locked steps are state === 'locked' and are not in the intial list of step IDs
				// Time locked steps that have already been completed will stay complete and should still be redeemable
				return true;
			}
		});

		displayedStepIDs = this._sortDisplayedStepIDs(displayedStepIDs);

		if (this.dailyCountdown && activeStepIDs.length > 0) {
			if (!this.dailyCountdown.missionStepInterface) {
				this.dailyCountdown.missionStepInterface = this.dailyCountdown.addComponent('MissionStepInterface');
				this.dailyCountdown.missionStepInterface.missionInterface = this.missionInterface;
			}
			this.dailyCountdown.missionStepInterface.stepID = activeStepIDs[0];
		}

		this._currentlyDisplayedSteps = displayedStepIDs;

		// Populate table view with steps
		const prefabName = this.dailyMissionPrefab
			? this.dailyMissionPrefab.name
			: 'daily_mission';
		this._ensureTableViewPrefab();
		const stepCellData = displayedStepIDs.map((stepID) => {
			return {
				prefab: prefabName,
				data: {
					stepID,
					missionInterface: this.missionInterface,
					stepRewardSequence: this.stepRewardSequence,
					textConfiguration: this.textConfiguration,
				},
			};
		});

		// Prepend day complete module if applicable
		if (this.dayCompletePrefab) {
			let allTasksComplete = true;
			activeStepIDs.forEach((stepID) => {
				const stepData = this.missionInterface.getStepData(stepID);
				if (stepData.data.state !== 'redeemed') {
					allTasksComplete = false;
				}
			});
			if (allTasksComplete) {
				stepCellData.unshift({
					prefab: this.dayCompletePrefab.name,
					data: {},
				});
			}
		}

		if (this.dailyStepTable) {
			this.dailyStepTable.setCellData(stepCellData);
		}
	},

	_sortDisplayedStepIDs(displayedStepIDs) {
		// Sort by complete/active/redeemed then step ID
		const stepCount = this.missionInterface.getAllStepIDs().length;
		const priorityByStepState = {
			complete: 0 * stepCount,
			active: 1 * stepCount,
			redeemed: 2 * stepCount,
		};
		return _.sortBy(displayedStepIDs, (stepID) => {
			const stepData = this.missionInterface.getStepData(stepID);
			const state = stepData.data.state;
			return priorityByStepState[state] + (+stepID);
		});
	},

	_ensureTableViewPrefab() {
		if (this.dailyStepTable && this.dailyMissionPrefab) {
			this.dailyStepTable.addCellPrefab(this.dailyMissionPrefab);
		}

		if (this.dailyStepTable && this.dayCompletePrefab) {
			this.dailyStepTable.addCellPrefab(this.dayCompletePrefab);
		}
	},

});