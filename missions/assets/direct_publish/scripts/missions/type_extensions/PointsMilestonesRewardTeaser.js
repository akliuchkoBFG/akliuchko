const TAG = "PointsMilesonesRewardTeaser";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');
const MissionRewardTeaser = require('MissionRewardTeaser');

// Command data payload sections
const COMMAND_DATA_KEY_MILESTONES = 'pointsMilestones';

// Data keys within command data chunks
const KEY_MILESTONE_AWARDS = 'milestoneAwards';
const KEY_PRODUCT_PACKAGE_DATA = 'award';

cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionRewardTeaser,
		menu: 'Missions/Types/Points Milestones/Reward Teaser',
	},

	properties: {
		milestoneIndex: {
			default: 0,
			type: cc.Integer,
			tooltip: "Index of milestone reward to display",
			notify() {
				// Validate against milestone count
				if (this.milestoneCount) {
					// Wrap around the index if it passes the boundaries of the milestone awards array
					if (this.milestoneIndex >= this.milestoneCount || this.milestoneIndex < 0) {
						this.milestoneIndex = (this.milestoneIndex % this.milestoneCount + this.milestoneCount) % this.milestoneCount;
					}
				}
			},
		},
		milestoneCount: {
			default: 0,
			type: cc.Integer,
			readonly: true,
			tooltip: "Number of milestone rewards configured in mission data. Pulled from mission configuration",
		},
	},

	// Update progress variables whenever the command data is updated and call into the bar update
	onUpdateMissionData() {
		const milestonesCommandData = this.missionInterface.getMissionCommandData(COMMAND_DATA_KEY_MILESTONES);
		const milestoneAwards = milestonesCommandData[KEY_MILESTONE_AWARDS];
		this.milestoneCount = milestoneAwards.length;
		const productPackage = milestoneAwards[this.milestoneIndex][KEY_PRODUCT_PACKAGE_DATA];
		const teaser = this.getComponent(MissionRewardTeaser);
		teaser.setRewardsFromProductPackage(productPackage);
	},
});
