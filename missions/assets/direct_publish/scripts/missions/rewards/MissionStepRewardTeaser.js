const TAG = "MissionStepRewardTeaser";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionStepComponent = require('BaseMissionStepComponent');
const MissionRewardTeaser = require('MissionRewardTeaser');

cc.Class({
	extends: BaseMissionStepComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionRewardTeaser,
		menu: 'Add Mission Component/Rewards/Step Reward Teaser',
	},

	onUpdateMissionStepData() {
		const productPackageRewards = this.missionStepInterface.getAwardData();
		const teaser = this.getComponent(MissionRewardTeaser);
		teaser.setRewardsFromProductPackage(productPackageRewards);
	},
});