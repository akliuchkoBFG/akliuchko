const TAG = "MissionInfoButton";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionButton = require('MissionButton');
const MissionInfoController = require('MissionInfoController');

const ActionType = cc.Enum({
	show: 1,
	hide: 2,
	toggle: 3,
});

cc.Class({
	extends: MissionButton,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Buttons/Missions/Info',
		requireComponent: cc.Button,
		executeInEditMode: true,
	},

	properties: {
		missionInfo: {
			default: null,
			type: MissionInfoController,
			tooltip: 'Mission Info Controller is a required reference for this button to function',
		},
		actionType: {
			default: ActionType.show,
			tooltip: 'Configure this button to show, hide, or toggle the mission info',
			type: ActionType,
		},
	},

	performMissionAction: function() {
		if (this.missionInfo) {
			const actionFn = ActionType[this.actionType];
			this.missionInfo[actionFn]();
		} else {
			this.log.e("Mission Info controller not configured");
		}
	},
});
