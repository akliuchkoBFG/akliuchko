const LocalNotification = require('LocalNotification');

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Notification Group',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		notifications: {
			default: [],
			type: [LocalNotification],
			tooltip: 'List of individual notifications to include in this group'
		},
	},

	getValidNotifications(inputData) {
		const notificationPayloads = [];
		this.notifications.forEach((notification) => {
			const payload = notification.getNotificationPayload(inputData);
			if (payload) {
				notificationPayloads.push(payload);
			}
		});
		return notificationPayloads;
	},

	getNotificationTypes() {
		const allNotificationTypes = this.notifications.map((notification) => {
			return notification.type;
		});
		return allNotificationTypes;
	},
});
