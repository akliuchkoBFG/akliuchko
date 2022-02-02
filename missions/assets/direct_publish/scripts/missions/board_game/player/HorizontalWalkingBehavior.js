const TAG = "WalkingBehavior";
const ComponentLog = require('ComponentSALog')(TAG);
const MoveBehavior = require('MoveBehavior');
const SpineStateProperty = require('SpineStateProperty');

const SPINE_STATE_NAMES = [
	'jumpLeft',
	'jumpRight',
	'staticLeft',
	'staticRight'
];
const SKELETON_COMPONENT_PROP = 'skeleton';

cc.Class({
	extends: MoveBehavior,

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Board Game/Player Behavior – Walking',
		executeInEditMode: true,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	mixins: [ComponentLog],
	properties: {
		stepTime: {
			default: 0.5,
			type: cc.Float,
			tooltip: 'Amount of time (seconds) for one step done by Pawn, while moving to next tile',
		},

		currentPos: {
			default: new cc.Vec2(0, 0),
			visible: false
		},

		skeleton: SpineStateProperty.spSkeletonForProperties(
			SKELETON_COMPONENT_PROP,
			SPINE_STATE_NAMES,
			[
				'Skeleton component for board game randomizer state animations',
				'Adding this component will reveal states for jumping and static animations',
			].join('\n')
		),
		jumpLeft: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for looping the sequence while walking'
		),
		jumpRight: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for looping the sequence while walking'
		),
		staticLeft: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for looping while waiting for the result'
		),
		staticRight: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'Animation state for looping while waiting for the result'
		),

		setToSetupPose: {
			default: true,
			tooltip: 'Resets the Spine animation to its setup pose at the start of each step'
		}
	},

	move(player, targetTile, intermediateTiles) {
		this.player = player;
		this.currentPos = this.player.node.position;
		return this.jump([...intermediateTiles, targetTile]);
	},

	jump(tiles, i = 0) {
		return this.makeStep(tiles[i]).then(() => {
			++i;
			if (i < tiles.length) {
				return this.jump(tiles, i);
			}
		});
	},

	makeStep(nextTarget) {
		const worldPos = nextTarget.node.convertToWorldSpaceAR(cc.p(0, 0));
		const localPos = this.player.node.parent.convertToNodeSpaceAR(worldPos);
		const spineAnim = localPos.x > this.currentPos.x ? this.jumpRight : this.jumpLeft;
		this.currentPos = localPos;

		const move = new Promise((resolve) => {
			this.player.node.runAction(
				cc.sequence(cc.moveTo(this.stepTime, localPos.x, localPos.y), cc.callFunc(() => resolve())
			));
		});

		return Promise.all([move, spineAnim.play({setToSetupPose: this.setToSetupPose})]);
	},
});
