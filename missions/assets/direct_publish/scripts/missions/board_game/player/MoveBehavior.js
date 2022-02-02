cc.Class({
    extends: cc.Component,

    properties: {
		player: {
			visible:false,
			default: null,
			type: cc.Component,
			tooltip: 'Player',
		},
    },

    move(player, targetTile, intermediateTiles) {
        // Override to provide behavior for moving the player over time
		// e.g. setup a slide or teleport animation sequence
        this.player = player;
		this._moveToNode(targetTile.node);
		targetTile.claimReward();
		return Promise.resolve();
    },

    _moveToNode(node) {
		const worldPosition = node.convertToWorldSpaceAR(cc.p(0, 0));
		const localPosition = this.player.node.parent.convertToNodeSpaceAR(worldPosition);
		this.player.node.setPosition(localPosition);
	},
});
