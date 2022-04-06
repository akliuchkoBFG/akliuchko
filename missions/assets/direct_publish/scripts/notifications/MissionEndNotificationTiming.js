const NotificationTiming = require('NotificationTiming');

cc.Class({
	extends: NotificationTiming,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Timing/Mission End',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		secondsBefore: {
			default: 0,
			tooltip: 'Number of seconds before the end of the mission to schedule the notification',
		},
	},

	getSecondsInFuture(missionData) {
		// Ensure relevant data was provided
		if (!missionData || missionData.secondsRemaining == null) {
			this.log.w('Unexpected data format');
			return;
		}

		return missionData.secondsRemaining - this.secondsBefore;
	},
});
