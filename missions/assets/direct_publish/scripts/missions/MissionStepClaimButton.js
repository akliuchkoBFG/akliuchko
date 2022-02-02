const MissionStepButton = require('MissionStepButton');

cc.Class({
	extends: MissionStepButton,

	editor: CC_EDITOR && {
		menu: 'Buttons/Missions/Step Claim',
		requireComponent: cc.Button,
		executeInEditMode: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/519635201/Mission+Step+Claim+Button'
	},

	performMissionStepAction: function() {
		var button = this.getComponent(cc.Button);
		button.enabled = false;

		this.missionStepInterface.claimAward();
	},
});
