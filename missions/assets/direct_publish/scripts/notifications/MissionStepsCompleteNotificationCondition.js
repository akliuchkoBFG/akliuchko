const NotificationCondition = require('NotificationCondition');
const Comparator = require('Comparator');
const ComparisonEnum = Comparator.AllComparators;

cc.Class({
	extends: NotificationCondition,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Condition/Mission Steps Complete',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		stepsComplete: {
			default: 0,
			type: cc.Integer,
			tooltip: 'Comparison value for number of steps completed in the mission. e.g. "Current Steps Complete" = "Steps Complete"',
		},
		includeExpiredSteps: {
			default: false,
			tooltip: 'Count time locked steps that were completed before they expired',
		},
		comparison: {
			default: ComparisonEnum['='],
			type: ComparisonEnum,
		},
	},

	// TODO this should be using something abstracted to answer questions about mission data
	// Refactor MissionInterface/MissionStepInterface to have data-only classes that can be used independent of the component
	_getUnlockedSteps(stepList) {
		return stepList.filter((step) => {
			// Check if the step is time locked and active
			const isStepTimeUnlocked = step.data.secondsToUnlock == null
				|| (step.data.secondsToUnlock < 0 && step.data.secondsRemaining > 0);
			return step.data.state !== 'locked'
				// If time locked steps are included, steps that are state=complete/redeemed that have expired will count
				&& (this.includeExpiredSteps || isStepTimeUnlocked);
		});
	},

	_getCompleteSteps(stepList) {
		return stepList.filter((step) => {
			return step.data.state === 'complete' || step.data.state === 'redeemed';
		});
	},

	shouldSchedule(missionData) {
		// Ensure relevant data was provided
		if (!missionData || !missionData.mission || !missionData.mission.stepsNetworkData) {
			this.log.w('Unexpected data format');
			return false;
		}

		const unlockedSteps = this._getUnlockedSteps(missionData.mission.stepsNetworkData.data);
		const completeSteps = this._getCompleteSteps(unlockedSteps);

		return Comparator.doComparison(this.comparison, completeSteps.length, this.stepsComplete);
	},
});
