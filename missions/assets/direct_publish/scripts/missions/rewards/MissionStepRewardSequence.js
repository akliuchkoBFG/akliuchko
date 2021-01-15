const TAG = "MissionRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionStepComponent = require('BaseMissionStepComponent');
const MissionRewardSequence = require('MissionRewardSequence');

cc.Class({
	extends: BaseMissionStepComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionRewardSequence,
		menu: 'Add Mission Component/Rewards/Sequence/Step Sequence',
	},

	onUpdateMissionStepData() {
		const productPackageRewards = this.missionStepInterface.getAwardData();
		const sequence = this.getComponent(MissionRewardSequence);
		sequence.setRewardsFromProductPackage(productPackageRewards);
	},

	playSequence() {
		return this.getComponent(MissionRewardSequence).playSequence();
	},
});