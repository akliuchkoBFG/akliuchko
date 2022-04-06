const TAG = "LocalNotification";
const ComponentLog = require('ComponentSALog')(TAG);
const NotificationCondition = require('NotificationCondition');
const NotificationTiming = require('NotificationTiming');

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Local Notification',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		timing: {
			default: null,
			type: NotificationTiming,
			tooltip: 'Component that determines when to send the notification',
		},
		type: {
			default: '',
			tooltip: 'Internal identifier for a specific notification, must be unique for each notification that should show in a given schedule',
		},
		title: {
			default: '',
			tooltip: '(optional) Notification title. Android only',
		},
		text: {
			default: '',
			tooltip: 'Notification text. This is the primary content of the notification',
		},
		lateText: {
			default: '',
			tooltip: [
				'(Optional) text that should replace the standard message if this notification expires.',
				'Omitting will prevent the notification from sending if the notification expired before closing the app',
			].join('\n'),
		},
	},

	_shouldSchedule(inputData) {
		const conditions = this.getComponents(NotificationCondition);
		let valid = true;
		for (let i = 0; i < conditions.length; i++) {
			valid = valid && conditions[i].shouldSchedule(inputData);
			if (!valid) {
				break;
			}
		}
		return valid;
	},

	getSecondsInFuture(inputData) {
		if (!this.timing) {
			return;
		}
		return this.timing.getSecondsInFuture(inputData);
	},

	getNotificationPayload(inputData) {
		if (!this.text || !this.type) {
			const identifier = this.node && this.node.name || 'unknown_notification';
			this.log.e('Notification not configured: ' + identifier);
			return;
		}
		if (!this._shouldSchedule(inputData)) {
			// Failed notification condition checks
			return;
		}
		const secondsInFuture = this.getSecondsInFuture(inputData);
		if (secondsInFuture == null) {
			this.log.w('Missing or misconfigured timing component, skipping notification');
			return;
		}
		if (secondsInFuture < 0 && !this.lateText) {
			// Notification already expired and is not configured to send when expired
			return;
		}
		const notificationPayload = {
			type: this.type,
			title: this.title,
			text: this.text,
			lateText: this.lateText,
			secondsInFuture,
		};
		return notificationPayload;
	},
});
