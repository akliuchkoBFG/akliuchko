
const MissionInterface = require('MissionInterface');

const TAG = "baseMissionComponent";
const ComponentLog = require('ComponentSALog')(TAG);

// Components should extend this to interface with Mission specific data, and not instantiate this directly

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		executeInEditMode: true,
	},

	properties: {
		missionInterface: {
			default: null,
			type: MissionInterface,
			tooltip: "This component requires a MissionInterface component attached to node to obtain any data",
		},

		findMyInterface: {
			visible: function() { return !this.missionInterface; },
			get: function() { return !!this.missionInterface; },
			set: function() { this.missionInterface = MissionInterface.findInterfaceInScene(this); },
			tooltip: "Toggle to find the MissionInterface in the hierarchy",
		},
	},

	// use this for initialization
	onLoad: function () {
		this.missionInterface = this.missionInterface || MissionInterface.findInterfaceInScene(this);
		if (this.missionInterface) {
			this.missionInterface.on('updateMissionDataEvent', this.onUpdateMissionData, this);
		}
	},

	onEnable: function() {
		if (this.missionInterface.isInitialized()) {
			this.onUpdateMissionData();
		}
	},

	onUpdateMissionData: function() {
		// override this in components
	},

});
