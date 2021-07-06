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
		const productPackageRewards = this._getProductPackageRewards();
		const sequence = this.getComponent(MissionRewardSequence);
		sequence.setRewardsFromProductPackage(productPackageRewards);
	},

	onClaim() {
		// Claim results may affect sequence, refresh sequence data
		this.missionInterface.targetOff(this);
		this.onUpdateMissionData();
	},

	// Combines award and awardResult into a single data payload
	_getProductPackageRewards() {
		const productPackageRewards = _.cloneDeep(this.missionInterface.getAwardData());
		if (!productPackageRewards) {
			return productPackageRewards;
		}
		const awardResults = this.missionInterface.getAwardResultData();
		if (awardResults.length === 0) {
			// Award has not been claimed, result data not yet available
			// Listen for claim message if a lootbox is present since lootbox is not deterministic
			if (productPackageRewards.ProductPackageItemLootBox) {
				this.missionInterface.on('claimedMissionAward', this.onClaim, this);
			}
		}
		const indexByClass = _.mapValues(productPackageRewards, () => { return 0; });
		awardResults.forEach((awardResult) => {
			const className = awardResult.class;
			const currentIndex = indexByClass[className]++;
			productPackageRewards[className][currentIndex].awardResult = awardResult;
		});
		return productPackageRewards;
	},

	playSequence() {
		return this.getComponent(MissionRewardSequence).playSequence();
	},

	onDestroy() {
		try {
			this.missionInterface.targetOff(this);
		} catch (e) {/* Intentionally empty */}
	},
});