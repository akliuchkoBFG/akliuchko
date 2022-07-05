const TAG = "BoardGameTile";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardTeaser = require('MissionRewardTeaser');

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	properties: {
		teaser: {
			default: null,
			type: MissionRewardTeaser,
		},
		_claimed: {
			default: false,
			tooltip: 'Has this tile\'s reward already been claimed by the player?',
		},
	},

	setProductPackage(productPackageConfig, lootboxIndex) {
		if (this.teaser) {
			this.teaser.setRewardsFromProductPackage(productPackageConfig);
		}
		this._lootboxIndex = lootboxIndex;
	},

	// Show / Reset reward to default state
	unclaimReward() {
		this._claimed = false;
		if (this.teaser) {
			this.teaser.node.opacity = 255;
		}
	},

	// Hide reward when first claimed by the player
	claimReward() {
		this._claimed = true;
		if (this.teaser) {
			this.teaser.node.opacity = 0;
		}
	},

	// Hide reward when player comes back to an existing event with claimed rewards
	markRewardClaimed() {
		this._claimed = true;
		if (this.teaser) {
			this.teaser.node.opacity = 0;
		}
	},

	getLootboxIndex() {
		return this._lootboxIndex;
	},
});
