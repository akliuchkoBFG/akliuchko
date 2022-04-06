const TAG = "LocalNotificationScheduler";
const ComponentLog = require('ComponentSALog')(TAG);

const NotificationGroup = require('NotificationGroup');

module.exports = cc.Class({
	name: 'LocalNotificationScheduler',
	mixins: [ComponentLog],
	properties: {
		notificationGroups: {
			default: [],
			type: NotificationGroup,
			tooltip: 'List of notification groups, will schedule notifications from the first eligible group with valid notifications to send',
		},
		channelID: {
			default: '',
			displayName: 'Channel ID',
			tooltip: 'Internal unique channel identifier for notification category. e.g. "vaults.notifyReward"'
		},
		channelName: {
			default: '',
			tooltip: 'User facing channel name for notification category. e.g. "Vaults"',
		},
		channelDescription: {
			default: '',
			tooltip: 'User facing channel description for notification category. e.g. "Notify when vaults are ready to be opened."'
		},
		scenePrefix: {
			default: '',
			tooltip: '(optional) Provide a scene-specific internal identifier for all notification types to avoid conflicts for similar notifications on a different scene',
		},
	},

	scheduleNotifications(inputData) {
		for (let i = 0; i < this.notificationGroups.length; i++) {
			const group = this.notificationGroups[i];
			const notificationPayloads = group.getValidNotifications(inputData);
			if (notificationPayloads.length > 0) {
				notificationPayloads.forEach(this._queueNotification.bind(this));
				// Found the notifications to schedule, ignore lower priority groups
				break;
			}
		}
	},

	_queueNotification(payload) {
		// Add the channel info to each notification and queue it
		payload.channelID = this.channelID;
		payload.channelName = this.channelName;
		payload.channelDescription = this.channelDescription;
		if (this.scenePrefix) {
			payload.type = this.scenePrefix + '.' + payload.type;
		}
		this.log.d("Scheduling notification: " + JSON.stringify(payload));
		SALocalNotificationService.queueNotification(payload);
	},

	cancelNotifications() {
		const allNotificationTypes = [];
		this.notificationGroups.forEach((group) => {
			const groupTypes = group.getNotificationTypes();
			groupTypes.forEach((type) => {
				allNotificationTypes.push(type);
			});
		});
		SALocalNotificationService.cancelNotifications(allNotificationTypes);
	},
});