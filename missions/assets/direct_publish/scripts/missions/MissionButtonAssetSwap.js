const BaseMissionComponent = require('BaseMissionComponent');
const BADGE_HR = "badge_hr";
const BADGE_VIP = "badge_vip";

cc.Class({
	extends: BaseMissionComponent,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Buttons/CTAAssetSwap',
		requireComponent: cc.Button,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/4024008705/Mission+Button+Asset+Swap'
	},

	properties: {
		sprite_default: {
			type: cc.SpriteFrame,
			default: null,
			displayName: "Default - Normal",
			tooltip: "Default Sprite",
		},
		sprite_default_pressed: {
			type: cc.SpriteFrame,
			default: null,
			displayName: "Default - Pressed",
			tooltip: "Default Sprite (Pressed)",
		},
		sprite_VIP: {
			type: cc.SpriteFrame,
			default: null,
			displayName: "VIP - Normal",
			tooltip: "VIP Sprite",
		},
		sprite_VIP_pressed: {
			type: cc.SpriteFrame,
			default: null,
			displayName: "VIP - Pressed",
			tooltip: "VIP Sprite (Pressed)",
		},
		sprite_HR: {
			type: cc.SpriteFrame,
			default: null,
			displayName: "HR - Normal",
			tooltip: "HR Sprite",
		},
		sprite_HR_pressed: {
			type: cc.SpriteFrame,
			default: null,
			displayName: "HR - Pressed",
			tooltip: "HR Sprite (Pressed)",
		},

	},

	onUpdateMissionData: function() {
		if (this.missionInterface) {
			let button = this.getComponent("cc.Button");
			const tags = this.missionInterface.getTags().map( function(tag){ return tag.toLowerCase(); });
			if (tags.indexOf(BADGE_VIP) !== -1 && this.sprite_VIP) {
				button.normalSprite = this.sprite_VIP;
				button.pressedSprite = this.sprite_VIP_pressed;
			} else if (tags.indexOf(BADGE_HR) !== -1 && this.sprite_HR) {
				button.normalSprite = this.sprite_HR;
				button.pressedSprite = this.sprite_HR_pressed;
			} else if (this.sprite_default) {
				button.normalSprite = this.sprite_default;
				button.pressedSprite = this.sprite_default_pressed;
			}
		}
	}
});
