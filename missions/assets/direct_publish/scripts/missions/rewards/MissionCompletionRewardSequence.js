const TAG = "MissionCompletionRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');
const MissionRewardSequence = require('MissionRewardSequence');

cc.Class({
	extends: BaseMissionComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionRewardSequence,
		menu: 'Add Mission Component/Rewards/Sequence/Mission Completion Sequence',
	},

	onUpdateMissionData() {
		const productPackageRewards = this.missionInterface.getAwardData();
		const sequence = this.getComponent(MissionRewardSequence);
		sequence.setRewardsFromProductPackage(productPackageRewards);
	},

	playSequence() {
		return this.getComponent(MissionRewardSequence).playSequence();
	},
});