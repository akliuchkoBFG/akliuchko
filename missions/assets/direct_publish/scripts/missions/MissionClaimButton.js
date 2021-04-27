const MissionButton = require('MissionButton');

cc.Class({
	extends: MissionButton,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Buttons/Mission Claim',
		requireComponent: cc.Button,
		executeInEditMode: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/519635201/Mission+Claim+Button'
	},

	performMissionAction: function() {
		var button = this.getComponent(cc.Button);
		button.enabled = false;

		this.missionInterface.claimMissionAward();
	},
});
