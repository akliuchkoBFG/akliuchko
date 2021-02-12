const BaseMissionComponent = require('BaseMissionComponent');

const BADGE_HR = "badge_hr";
const BADGE_VIP = "badge_vip";

cc.Class({
		extends: BaseMissionComponent,

		editor: CC_EDITOR && {
				executeInEditMode: true,
				menu: 'Add Mission Component/Mission Badge',
		},

		properties: {
				badge_VIP: {
					type: cc.Node,
					default: null,
					displayName: "VIP Badge",
					tooltip: "Badge for VIP Players",
				},
				badge_HR: {
					type: cc.Node,
					default: null,
					displayName: "HR Badge",
					tooltip: "Badge for High Rollers",
				}
		},

		onUpdateMissionData: function() {
			const tags = this.missionInterface.getTags().map( function(tag){ return tag.toLowerCase(); });
			const hrTag = tags.indexOf(BADGE_HR) !== -1;
			const vipTag = tags.indexOf(BADGE_VIP) !== -1;
			if (this.badge_HR) {
				this.badge_HR.active = hrTag;
			}
			if (this.badge_VIP) {
				this.badge_VIP.active = vipTag && !hrTag;
			}
		},
});
