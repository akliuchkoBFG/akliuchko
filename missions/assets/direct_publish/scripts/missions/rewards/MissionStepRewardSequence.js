const TAG = "MissionStepRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionStepComponent = require('BaseMissionStepComponent');
const MissionRewardSequence = require('MissionRewardSequence');

cc.Class({
	extends: BaseMissionStepComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionRewardSequence,
		menu: 'Rewards/Missions/Step Sequence',
	},

	onUpdateMissionStepData() {
		const productPackageRewards = this._getProductPackageRewards();
		const sequence = this.getComponent(MissionRewardSequence);
		sequence.setRewardsFromProductPackage(productPackageRewards);
	},

	onClaim(evt) {
		if (evt.detail && evt.detail.stepID === this.missionStepInterface.stepID) {
			// Claim results may affect sequence, refresh sequence data
			this.missionStepInterface.missionInterface.targetOff(this);
			this.onUpdateMissionStepData();
		}
	},

	// Combines award and awardResult into a single data payload
	_getProductPackageRewards() {
		const productPackageRewards = _.cloneDeep(this.missionStepInterface.getAwardData());
		if (!productPackageRewards) {
			return productPackageRewards;
		}
		const awardResults = this.missionStepInterface.getAwardResultData();
		if (awardResults.length === 0) {
			// Award has not been claimed, result data not yet available
			// Listen for claim message if a lootbox is present since lootbox is not deterministic
			if (productPackageRewards.ProductPackageItemLootBox) {
				this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
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
			this.missionStepInterface.missionInterface.targetOff(this);
		} catch (e) {/* Intentionally empty */}
	},
});