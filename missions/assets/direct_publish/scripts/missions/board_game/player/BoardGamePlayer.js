const TAG = "BoardGamePlayer";
const ComponentLog = require('ComponentSALog')(TAG);
const MoveBehavior = require('MoveBehavior');

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Board Game/Player',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	mixins: [ComponentLog],
	properties: {
		moveInEditor: {
			default: null,
			type: cc.Node,
			editorOnly: true,
			notify() {
				if (!this.moveInEditor) {
					return;
				}
				this._moveToNode(this.moveInEditor);
				this.moveInEditor = null;
			},
			tooltip: "Editor preview helper for moving the player pawn to the anchor of a specific tile",
		},
		moveBehavior: {
			default: null,
			type: MoveBehavior,
			tooltip: 'Players moving behavior',
		},
	},

	setupOnTile(tile) {
		this._moveToNode(tile.node);
	},

	_moveToNode(node) {
		const worldPosition = node.convertToWorldSpaceAR(cc.p(0, 0));
		const localPosition = this.node.parent.convertToNodeSpaceAR(worldPosition);
		this.node.setPosition(localPosition);
	},

	move(targetTile, intermediateTiles) {
		if (this.moveBehavior) {
			return this.moveBehavior.move(this, targetTile, intermediateTiles);
		}
		return Promise.resolve();
	},
});
