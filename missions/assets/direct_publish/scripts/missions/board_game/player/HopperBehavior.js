const MoveBehavior = require('MoveBehavior');

cc.Class({
    extends: MoveBehavior,

    properties: {
        stepTime: {
			default: 0.5,
			type: cc.Float,
			tooltip: 'Amount of time (seconds) for one step done by Pawn, while moving to next tile',
		},
    },

    move(player, targetTile, intermediateTiles) {
        this.player = player;
        return this.walk([...intermediateTiles, targetTile]);		
    },

	walk(tiles) {        
		return new Promise((resolve) => {
			const actions = tiles.map((targetTile) => this.makeStep(targetTile));

			actions.push(cc.callFunc(() => {
				this.player.node.setScale(1, 1);
				tiles[tiles.length - 1].claimReward();
				resolve();
			}));
			this.player.node.runAction(cc.sequence(...actions));
		});
	},

	makeStep(nextTarget) {
		const worldPos = nextTarget.node.convertToWorldSpaceAR(cc.p(0, 0));
		const localPos = this.player.node.parent.convertToNodeSpaceAR(worldPos);

		return cc.sequence(
            cc.spawn(
				cc.scaleTo(this.stepTime - 0.1, 0.95, 0.8),
				cc.moveTo(this.stepTime, localPos.x, localPos.y)
            ),
            cc.scaleTo(0.1, 1, 1)
		);
	},
});
