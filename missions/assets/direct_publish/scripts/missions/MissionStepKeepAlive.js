const BaseMissionStepComponent = require('BaseMissionComponent');
const EditorLabelProperty = require('EditorLabelProperty');

const DESCRIPTION = `While at a slot machine, this helps extend the player session at a machines so they don't return 
to the 'are you still playing image', or get kicked from the table while interacting with missions content`;

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},
	properties: {
		editorDescription: {
			get() {
				if (!this._editorDescription) {
					this._editorDescription = new EditorLabelProperty(DESCRIPTION);
				}
				return this._editorDescription;
			},
			type: EditorLabelProperty,
		},
	},

	onLoad: function () {
		this.missionInterface = this.missionInterface || MissionInterface.findInterfaceInScene(this, "MissionInterface");
		if (this.missionInterface) {
			this.missionInterface.on('claimedStepAward', this.sendKeepAlive);
			this.missionInterface.on('claimedMissionAward', this.sendKeepAlive);
		}
	},

	sendKeepAlive: function() {
		// Currently we are not providing any payload with our message, this can be leveraged later if we want to do 
		// additional work on the server endpoint.  EX: Preemptively add extra time
		SANotificationCenter.getInstance().postNotification('mission.keepalive', {} );
	},

});
