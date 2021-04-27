const TAG = "BoardGamePlayer";
const ComponentLog = require('ComponentSALog')(TAG);

const BoardGameTile = require('BoardGameTile');

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],
	properties: {
		moveInEditor: {
			default: null,
			type: BoardGameTile,
			editorOnly: true,
			notify() {
				if (!this.moveInEditor) {
					return;
				}
				this._moveToNode(this.moveInEditor.node);
				this.moveInEditor = null;
			},
			tooltip: "Editor preview helper for moving the player pawn to the anchor of a specific tile",
		},
	},

	setupOnTile(tile) {
		this._moveToNode(tile.node);
	},

	move(targetTile, intermediateTiles) {
		// Override to provide behavior for moving the player over time
		// e.g. setup a slide or teleport animation sequence
		this._moveToNode(targetTile.node);
		targetTile.claimReward();
		return Promise.resolve();
	},

	_moveToNode(node) {
		const worldPosition = node.convertToWorldSpaceAR(cc.p(0, 0));
		const localPosition = this.node.parent.convertToNodeSpaceAR(worldPosition);
		this.node.setPosition(localPosition);
	},
});
