const TAG = "DailyMissionStepRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionStepRewardSequence = require('MissionStepRewardSequence');
const MissionRewardSequence = require('MissionRewardSequence');
const PointsMilestonesProgress = require('PointsMilestonesProgress');
const DooberComponent = require('DooberComponent');

const AnimationClipProperty = require('AnimationClipProperty');
const ANIM_COMPONENT_PROPERTY = 'pointsAnimation';

cc.Class({
	extends: MissionStepRewardSequence,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Daily/Step Reward Sequence',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: () => ({
		missionController: {
			default: null,
			type: require('DailyMissionsController'), // eslint-disable-line global-require
			tooltip: "Reference to the main daily mission controller, used for understanding which step cell initiated the claim action",
		},

		milestonesProgress: {
			default: null,
			type: PointsMilestonesProgress,
			tooltip: "Reference to the milestone progress tracker for setting up animations for points increments"
		},

		pointsDoobers: {
			default: null,
			type: DooberComponent,
			tooltip: "Doobers for showing points going to the progress meter",
		},

		// Property name must match ANIM_COMPONENT_PROPERTY
		pointsAnimation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			[
				'pointsProgress',
			],
			[
				'Animation component for transitions relating to the milestone progress UI (optional)',
				'Adding this component will reveal states for Points Progress',
			].join('\n')
		),

		pointsProgress: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for incrementing points progress'
		),
	}),

	onEnable() {
		this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
		this._super();
	},

	onUpdateMissionStepData() {
		// Intentionally does not call super
		// Skip preloading rewards, parallel missions can claim any step, so wait for the stepID with a claim result
	},

	onClaim(evt) {
		// Update the step ID to reflect the parallel step being claimed
		// This triggers the step data update that references the necessary product packages
		this.missionStepInterface.stepID = evt.detail.stepID;
	},

	playSequence() {
		const stepID = this.missionStepInterface.stepID;
		const productPackageRewards = this._getProductPackageRewards();
		const sequence = this.getComponent(MissionRewardSequence);
		sequence.setRewardsFromProductPackage(productPackageRewards);
		this._claimChoreography = Promise.resolve()
		.then(() => {
			// Play step claim choreography
			if (this.missionController) {
				return this.missionController.playStepClaim(stepID);
			}
		})
		.then(() => {
			return this._playSceneEffects(stepID, productPackageRewards, sequence);
		});
		this._claimChoreography.then(() => {
			// This might now be pointing at choreography for a subsequent claim sequence
			// The final sequence must complete before updating mission data
			if (this._claimChoreography.isResolved()) {
				this.missionStepInterface.missionInterface.triggerMissionUpdateNotice();
			}
		});
		return this._claimChoreography;
	},

	_playSceneEffects(stepID, productPackageRewards, sequence) {
		// Wait for active scene effects to complete before starting new scene effects
		const currentSequence = this._activeSceneEffects || Promise.resolve();
		this._activeSceneEffects = currentSequence
		.then(() => {
			if (this.pointsProgress.isValid()) {
				// Progress animation clip is configured, setup progress animation pieces like point progress bar and doobers
				const pointResult = this._getPointRewardFromProductPackage(productPackageRewards).awardResult.result;
				if (this.milestonesProgress) {
					const toPoints = pointResult.finalCount;
					this.milestonesProgress.setupProgressTransition(toPoints);
				}

				if (this.pointsDoobers) {
					const sourcePosition = this.missionController
						? this.missionController.getDooberSourceWorldPositionForStep(stepID)
						: null;
					if (sourcePosition) {
						const localPosition = this.pointsDoobers.node.parent.convertToNodeSpaceAR(sourcePosition);
						this.pointsDoobers.node.setPosition(localPosition);
					} else {
						this.log.e("Unable to get points doober source position for stepID " + stepID);
					}
					this.pointsDoobers.totalParticles = pointResult.grantedCount;
				}
				return this.pointsProgress.play();
			}
		})
		.then(() => {
			// Finalize progress values to allow future transitions to play correctly
			if (this.milestonesProgress) {
				this.milestonesProgress.completeProgressTransition();
			}

			// For daily mission steps the traditional step reward sequence is optional, but if it's configured play it here.
			const shouldPlaySequence = sequence.hasItems();
			if (shouldPlaySequence) {
				return sequence.playSequence();
			}
		});
		return this._activeSceneEffects;
	},

	_getPointRewardFromProductPackage(productPackageRewards) {
		const missionPointItems = productPackageRewards.ProductPackageItemMissionPoints;
		if (!missionPointItems || missionPointItems.length === 0) {
			return null;
		}

		let pointReward = null;
		missionPointItems.forEach((pointItem) => {
			if (pointItem.templateID === this.missionStepInterface.missionInterface.getTemplateID()) {
				pointReward = pointItem;
			}
		});
		return pointReward;
	},
});