const TAG = "TreasureQuestRewardsController";
const ComponentLog = require('ComponentSALog')(TAG);
const MissionRewardTeaser = require('MissionRewardTeaser');
const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
		menu: 'Missions/TreasureQuest/RewardsController',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

    properties: {
        rewardHelper: {
			default: null,
			type: cc.Node,
			tooltip: 'Helper for setting the array of rewards using a parent container, orders tiles by numeric value in the corresponding node name',
			editorOnly: true,
			notify() {
				if (!this.rewardHelper || !CC_EDITOR) {
					return;
				}

				const rewards = this.rewardHelper.getComponentsInChildren(MissionRewardTeaser);
				if (rewards.length === 0) {
					Editor.warn("BoardGameTile components not found in Tile Helper node " + this.rewardHelper.name);
					this.rewardHelper = null;
					return;
				} 
				const sortedTiles = _.sortBy(rewards, (tile) => {
                    const nodeName = tile.node.name;
					// Strip out all non-numeric characters for sorting
					return +nodeName.replace(/[^\d]+/g, '');
				});
				this.rewards = sortedTiles;
				this.rewardHelper = null;
			},
		},

        rewards: {
			default: [],
			type: [MissionRewardTeaser],
			tooltip: 'Array of tiles, in the sequential order they should be traversed',
		},
    },

    onUpdateMissionStepData: function() {
        if (this.missionStepInterface && this.missionStepInterface.isInitialized()) {
            const stepID = parseInt(this.missionStepInterface.stepID);

            this.rewards.forEach((reward, index) => {
                if (index < stepID) {
                    reward.node.removeFromParent();
                }
            });
        }
    },

    claimReward() {
        const stepID = +this.missionStepInterface.stepID;
        const reward = this.rewards[stepID];
        if (reward && this.missionStepInterface.getState() === 'complete') {
            return new Promise((resolve) => {
                reward.node.runAction(
                    cc.sequence(cc.fadeOut(0.5), cc.callFunc(() => resolve())
                ));
            });
        }
        return Promise.resolve();
    },

    onLoad: function () {

    },

    start: function() {
    
    }
});
