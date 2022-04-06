const NotificationTiming = require('NotificationTiming');

cc.Class({
	extends: NotificationTiming,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Timing/Mission Start',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		secondsAfter: {
			default: 0,
			tooltip: 'Number of seconds after the start of the mission to schedule the notification',
		},
	},

	getSecondsInFuture(missionData) {
		// Ensure relevant data was provided
		if (!missionData || missionData.secondsActive == null) {
			this.log.w('Unexpected data format');
			return;
		}

		return this.secondsAfter - missionData.secondsActive;
	},
});
