const TAG = "MissionStepPointsRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionStepRewardSequence = require('MissionStepRewardSequence');
const MissionPointsRewardSequence = require('MissionPointsRewardSequence');

const COMMAND_DATA_KEY_POINTS = 'points';
const KEY_CURRENT_POINTS = 'current';

cc.Class({
	extends: MissionStepRewardSequence,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionPointsRewardSequence,
		menu: 'Add Mission Component/Rewards/Sequence/Step Points Sequence',
	},

	onUpdateMissionStepData() {
		const productPackageRewards = this._getRewardsForAllProductPackages();
		const sequence = this.getComponent(MissionPointsRewardSequence);
		sequence.setRewardsFromProductPackage(productPackageRewards);
	},

	_getRewardsForAllProductPackages(){
		const missionInterface = this.missionStepInterface.missionInterface;
		const activeSteps = missionInterface.getAnyStepClaimable();
		let productPackageAwards = [];
		let awardResults = [];
		activeSteps.forEach(function(stepData){
			let prodPackage = stepData.data.award;
			let awardResultList = stepData.data.awardResult;

			if(awardResultList.length === 0) {
				if (prodPackage.ProductPackageItemLootBox) {
					missionInterface.on('claimedStepAward', this.onClaim, this);
				}
			}

			awardResultList.forEach((awardResult) => {
				const className = awardResult.class;
				const currentIndex = indexByClass[className]++;
				prodPackage[className][currentIndex].awardResult = awardResult;
			});

			productPackageAwards.push(prodPackage);
			// We may have to deal with some of this data being old. getAwardResultData normally has an update in it
			awardResults.push(awardResultList);

		},this);

		return productPackageAwards;
	},
});