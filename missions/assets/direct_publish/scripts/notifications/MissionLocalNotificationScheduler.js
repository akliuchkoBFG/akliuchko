const TAG = "MissionLocalNotificationScheduler";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');
const LocalNotificationScheduler = require('LocalNotificationScheduler');

const ToDestroy = 1 << 2; // This flag is omitted from cc.Object.Flags but is used for a node being destroyed
const DestroyingBitmask = cc.Object.Flags.Destroyed | cc.Object.Flags.Destroying | ToDestroy;

cc.Class({
	extends: BaseMissionComponent,
	mixins: [
		ComponentLog,
		LocalNotificationScheduler
	],

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Mission Scheduler',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	// Check notifications against current mission state when the popup closes
	onDisable() {
		// Walk the node tree upwards to see if the scene is closing
		// This is a hack around node activation flip-flopping that happens during scene initialization
		let node = this.node;
		let isDestroying = false;
		while(node) {
			if (node._objFlags & DestroyingBitmask) {
				isDestroying = true;
				break;
			}
			node = node.parent;
		}
		if (!isDestroying) {
			// Node is being disabled as part of normal lifecycle events
			return;
		}
		this.cancelNotifications();
		const missionData = this.missionInterface._missionData;
		this.scheduleNotifications(missionData);
	},
});
