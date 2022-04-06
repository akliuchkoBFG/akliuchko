const NotificationCondition = require('NotificationCondition');
const Comparator = require('Comparator');
const ComparisonEnum = Comparator.AllComparators;

cc.Class({
	extends: NotificationCondition,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Condition/Mission Steps Remaining',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		stepsRemaining: {
			default: 0,
			type: cc.Integer,
			tooltip: 'Comparison value for number of steps not completed or redeemed in the mission. e.g. "Current Steps Remaining" = "Steps Remaining"',
		},
		includeExpiredSteps: {
			default: false,
			tooltip: 'Count time locked steps that expired',
		},
		includeTimeLockedSteps: {
			default: false,
			tooltip: 'Count time locked steps that have not yet unlocked',
		},
		comparison: {
			default: ComparisonEnum['='],
			type: ComparisonEnum,
		},
	},

	// TODO this should be using something abstracted to answer questions about mission data
	// Refactor MissionInterface/MissionStepInterface to have data-only classes that can be used independent of the component
	_getActiveSteps(stepList) {
		return stepList.filter((step) => {
			return step.data.state === 'active';
		});
	},

	_getLockedSteps(stepList) {
		let lockedSteps = stepList.filter((step) => {
			return step.data.state === 'locked';
		});

		if (!this.includeExpiredSteps) {
			// Filter out expired steps
			lockedSteps = lockedSteps.filter((step) => {
				return step.data.secondsRemaining == null
					|| step.data.secondsRemaining <= 0;
			});
		}

		if (!this.includeTimeLockedSteps) {
			// Filter out steps that haven't unlocked yet
			lockedSteps = lockedSteps.filter((step) => {
				return step.data.secondsToUnlock == null
					|| step.data.secondsToUnlock > 0;
			});
		}

		return lockedSteps;
	},

	shouldSchedule(missionData) {
		// Ensure relevant data was provided
		if (!missionData || !missionData.mission || !missionData.mission.stepsNetworkData) {
			this.log.w('Unexpected data format');
			return false;
		}

		const activeSteps = this._getActiveSteps(missionData.mission.stepsNetworkData.data);
		const lockedSteps = this._getLockedSteps(missionData.mission.stepsNetworkData.data);

		return Comparator.doComparison(this.comparison, activeSteps.length + lockedSteps.length, this.stepsRemaining);
	},
});
