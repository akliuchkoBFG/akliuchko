const MissionStepInterface = require('MissionStepInterface');

const TAG = "baseStepComponent";
const ComponentLog = require('ComponentSALog')(TAG);

// Components should extend this to interface with Mission STEP specific data, and not instantiate this directly

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		executeInEditMode: true,
	},

	properties: {
		missionStepInterface: {
			default: null,
			type: MissionStepInterface,
			tooltip: "This component requires a MissionStepInterface component attached to node to obtain any data",
		},

		findMyInterface: {
			visible: function() { return !this.missionStepInterface; },
			get: function() { return !!this.missionStepInterface; },
			set: function() { this.missionStepInterface = MissionStepInterface.findInterfaceInScene(this); },
			tooltip: "Toggle to find a MissionStepInterface in the hierarchy",
		},
	},

	// use this for initialization
	onLoad: function () {
		this.missionStepInterface = this.missionStepInterface || MissionStepInterface.findInterfaceInScene(this, 'MissionStepInterface');
		if (this.missionStepInterface) {
			this.missionStepInterface.on('updateMissionStepDataEvent', this.onUpdateMissionStepData, this);
		}
	},

	onEnable: function() {
		if (this.missionStepInterface.isInitialized()) {
			this.onUpdateMissionStepData();
		}
	},

	onUpdateMissionStepData: function() {
		// override this in components
	},

});
