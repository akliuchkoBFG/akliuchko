const MissionStepButton = require('MissionStepButton');

cc.Class({
	extends: MissionStepButton,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Claim Button',
		requireComponent: cc.Button,
		executeInEditMode: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/519635201/Mission+Step+Claim+Button'
	},

	performMissionStepAction: function() {
		var button = this.getComponent(cc.Button);
		button.active = false;
		
		this.missionStepInterface.claimAward();
	},
});
