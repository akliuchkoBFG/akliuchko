const TAG = "MissionCompletionRewardTeaser";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');
const MissionRewardTeaser = require('MissionRewardTeaser');

cc.Class({
	extends: BaseMissionComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionRewardTeaser,
		menu: 'Add Mission Component/Rewards/Teaser/Mission Completion Teaser',
	},

	onUpdateMissionData() {
		const productPackageRewards = this.missionInterface.getAwardData();
		const teaser = this.getComponent(MissionRewardTeaser);
		teaser.setRewardsFromProductPackage(productPackageRewards);
	},
});