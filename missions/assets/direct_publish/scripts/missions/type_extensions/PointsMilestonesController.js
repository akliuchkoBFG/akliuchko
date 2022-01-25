const TAG = "PointsMilesonesController";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');
const MissionRewardSequence = require('MissionRewardSequence');
const AnimationClipProperty = require('AnimationClipProperty');

/* eslint-disable no-unused-vars */
// Command data payload sections
const COMMAND_DATA_KEY_POINTS = 'points';
const COMMAND_DATA_KEY_MILESTONES = 'pointsMilestones';

// Data keys within command data chunks
const KEY_CURRENT_POINTS = 'current';
const KEY_MILESTONE_AWARDS = 'milestoneAwards';
const KEY_POINTS_REQUIRED = 'pointsRequired';
const KEY_PRODUCT_PACKAGE_DATA = 'award';
const KEY_MILESTONES_AWARDED = 'milestonesAwarded';
/* eslint-enable no-unused-vars */

/* Sample commandData payload
{
	"points": {
		"current": 10,
		"displayName": null
	},
	"pointsMilestones": {
		"milestonesAwarded": [0],
		"milestoneAwards": [
			{
				"pointsRequired": 5,
				"award": {} // Product package item data
			},
			{
				"pointsRequired": 20,
				"award": {} // Product package item data
			}
		]
	}
}
*/

cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Type Extensions/Points Milestones Controller',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		autoClaim: {
			default: false,
			tooltip: 'Automatically claim milestone rewards as they become available',
		},
		rewardSequence: {
			default: null,
			type: MissionRewardSequence,
			tooltip: '(optional) Reward sequence for visualizing milestone rewards being claimed',
		},
		milestoneClaimAnimation: AnimationClipProperty.ccAnimationForProperties(
			'milestoneClaimAnimation',
			['milestoneClaimStart', 'milestoneClaimEnd'],
			'(optional) Configurable animation clips for animations specific to each milestone'
		),
		milestoneClaimStart: AnimationClipProperty.arrayPropertyDefinition(
			'milestoneClaimStart',
			'milestoneClaimAnimation',
			'List of milestone animation clips, ordered by milestone. Clip plays at the start of claiming a weekly milestone (before sequence)'
		),
		milestoneClaimEnd: AnimationClipProperty.arrayPropertyDefinition(
			'milestoneClaimEnd',
			'milestoneClaimAnimation',
			'List of milestone animation clips, ordered by milestone. Clip plays at the end of claiming a weekly milestone (after sequence)'
		),
	},

	onUpdateMissionData() {
		if (CC_EDITOR) {
			// None of the logic here is editor safe
			return;
		}
		if (this._activeClaim && !this._activeClaim.isResolved()) {
			// Skip updating if a claim is currently in progress
			return;
		}
		// Setup state for claimed rewards
		const redeemed = this.getMilestonesAwarded();
		redeemed.forEach((milestoneTier) => {
			// Use the last frame of milestone claim animation to setup scene state for a claimed reward tier
			const claimEndClip = this.milestoneClaimEnd[milestoneTier];
			if (claimEndClip) {
				claimEndClip.sampleEnd();
			}
		});
		// Check for redeemable milestones
		const redeemable = this.getRedeemableMilestoneTiers();
		if (redeemable.length > 0) {
			const nextMilestoneTier = redeemable[0];
			if (this.autoClaim) {
				this.log.d("Starting milestone claim for tier: " + nextMilestoneTier);
				this._claimMilestoneWithChoreography(nextMilestoneTier);
			} else {
				this.emit('points_milestones.redeemable', {
					milestoneTier: nextMilestoneTier,
				});
			}
		}
	},

	_claimMilestoneWithChoreography(milestoneTier) {
		const claimStartAnim = this.milestoneClaimStart[milestoneTier];
		// Start playing milestone animation if available for latency hiding
		const milestoneAnimation = claimStartAnim ? claimStartAnim.play() : Promise.resolve();
		this._activeClaim = this.claimMilestoneTier(milestoneTier, false)
		.then((response) => {
			// Wait for milestone animation if it is still playing
			return milestoneAnimation.then(() => {
				return response;
			});
		})
		.then((response) => {
			const commandResult = response.commandResult;
			const missionData = response.missionData;
			this.emit('points_milestones.claimed', {
				commandResult,
				missionData,
			});
			return this._playRewardSequence(commandResult.award, commandResult.awardResult);
		})
		.then(() => {
			const claimEndAnim = this.milestoneClaimEnd[milestoneTier];
			if (claimEndAnim) {
				return claimEndAnim.play();
			}
		});
		// Intentionally separates primary claim choreography from triggering data updates
		return this._activeClaim.then(() => {
			this.missionInterface.onCommandComplete();
			this.emit('points_milestones.claim_complete', null);
		});
	},

	_playRewardSequence(award, awardResult) {
		if (!this.rewardSequence) {
			return Promise.resolve();
		}
		this.rewardSequence.setRewardsFromAwardAndResult(award, awardResult);
		return this.rewardSequence.playSequence();
	},

	getRedeemableMilestoneTiers() {
		const milestonesCommandData = this.missionInterface.getMissionCommandData(COMMAND_DATA_KEY_MILESTONES);
		const pointsCommandData = this.missionInterface.getMissionCommandData(COMMAND_DATA_KEY_POINTS);
		const currentPoints = pointsCommandData[KEY_CURRENT_POINTS];
		const milestoneAwards = milestonesCommandData[KEY_MILESTONE_AWARDS];
		const milestonesAwarded = milestonesCommandData[KEY_MILESTONES_AWARDED];
		const redeemableMilestones = [];
		milestoneAwards.forEach((milestoneAward, milestoneTier) => {
			if (milestoneAward[KEY_POINTS_REQUIRED] <= currentPoints && milestonesAwarded.indexOf(milestoneTier) === -1) {
				redeemableMilestones.push(milestoneTier);
			}
		});
		return redeemableMilestones;
	},

	getMilestonesAwarded() {
		const milestonesCommandData = this.missionInterface.getMissionCommandData(COMMAND_DATA_KEY_MILESTONES);
		const milestonesAwarded = milestonesCommandData[KEY_MILESTONES_AWARDED];
		return milestonesAwarded;
	},

	claimMilestoneTier(milestoneTier, notify) {
		return this.missionInterface.callCommand('redeemMilestoneReward', {milestoneTier}, notify);
	},

	claimFirstRedeemableMilestone() {
		const redeemable = this.getRedeemableMilestoneTiers();
		if (redeemable.length > 0) {
			return this.claimMilestoneTier(redeemable[0], true);
		} else {
			return Promise.reject(new Error('No milestone awards to claim'));
		}
	},

	hasRedeemableMilestones() {
		return this.getRedeemableMilestoneTiers().length > 0;
	},
});
