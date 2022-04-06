const NotificationTiming = require('NotificationTiming');
const StepType = cc.Enum({
	'Most Recent Unlock': 1,
	'Next Unlock': 2,
	'Specific Step': 3,
});

cc.Class({
	extends: NotificationTiming,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Timing/Step Unlock',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		secondsAfter: {
			default: 0,
			tooltip: 'Number of seconds after the step unlocking to schedule the notification',
		},
		stepType: {
			default: StepType['Most Recent Unlock'],
			type: StepType,
			tooltip: 'Determines which step id to use as a reference time',
		},
		stepID: {
			default: 0,
			type: cc.Integer,
			tooltip: 'Manual step ID override for "Specific Step" type',
			displayName: 'Step ID',
			visible() {
				return this.stepType === StepType['Specific Step'];
			},
		},
	},

	_getStepID(stepList) {
		if (this.stepType === StepType['Most Recent Unlock']) {
			let currentUnlockTime = -Number.MAX_SAFE_INTEGER;
			let stepID;
			for (let i = 0; i < stepList.length; ++i) {
				const stepData = stepList[i];
				const secondsToUnlock = stepData.data.secondsToUnlock;
				if (secondsToUnlock != null && secondsToUnlock <= 0 && secondsToUnlock > currentUnlockTime) {
					currentUnlockTime = secondsToUnlock;
					stepID = stepData.data.id;
				}
			}
			if (stepID == null) {
				this.log.w('Most recent unlock not found, steps are not time locked or no steps have been unlocked');
			}
			return stepID;
		} else if (this.stepType === StepType['Next Unlock']) {
			let currentUnlockTime = Number.MAX_SAFE_INTEGER;
			let stepID;
			for (let i = 0; i < stepList.length; ++i) {
				const stepData = stepList[i];
				const secondsToUnlock = stepData.data.secondsToUnlock;
				if (secondsToUnlock != null && secondsToUnlock > 0 && secondsToUnlock < currentUnlockTime) {
					currentUnlockTime = secondsToUnlock;
					stepID = stepData.data.id;
				}
			}
			if (stepID == null) {
				this.log.w('Next unlock not found, steps are not time locked or no steps will unlock in the future');
			}
			return stepID;
		} else if (this.stepType === StepType['Specific Step']) {
			return this.stepID;
		}
	},

	getSecondsInFuture(missionData) {
		// Ensure relevant data was provided
		if (!missionData || !missionData.mission || !missionData.mission.stepsNetworkData) {
			this.log.w('Unexpected data format');
			return;
		}

		const stepID = this._getStepID(missionData.mission.stepsNetworkData.data);
		if (stepID == null) {
			return;
		}
		const stepData = missionData.mission.stepsNetworkData.data[stepID];

		return this.secondsAfter + stepData.data.secondsToUnlock;
	},
});
