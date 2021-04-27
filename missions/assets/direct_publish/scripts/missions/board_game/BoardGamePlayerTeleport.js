const TAG = "BoardGamePlayerTeleport";
const ComponentLog = require('ComponentSALog')(TAG);

const BoardGamePlayer = require('BoardGamePlayer');
const SpineStateProperty = require('SpineStateProperty');
const SPINE_STATE_NAMES = [
	'appear',
	'vanish',
];
const SKELETON_COMPONENT_PROP = 'skeleton';

cc.Class({
	extends: BoardGamePlayer,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Board Game/Player – Teleport',
		executeInEditMode: true,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	mixins: [ComponentLog],
	properties: {
		skeleton: SpineStateProperty.spSkeletonForProperties(
			SKELETON_COMPONENT_PROP,
			SPINE_STATE_NAMES,
			[
				'Skeleton component for board game randomizer state animations',
				'Adding this component will reveal states for intro, loop, and outro',
			].join('\n')
		),
		appear: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'(Optional) Animation state for starting the randomization sequence before the result is known'
		),
		vanish: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'(Optional) Animation state for looping the randomization sequence while waiting for the result'
		),
	},

	__preload:SpineStateProperty.createPreloadFunction(SPINE_STATE_NAMES),

	move(targetTile, intermediateTiles) {
		// Disappear, move the player node while off screen and then reappear
		const animOpts = {
			setToSetupPose: false,
		};
		return this.vanish.play(animOpts)
		.then(() => {
			this._moveToNode(targetTile.node);
			targetTile.claimReward();
			return this.appear.play(animOpts);
		});
	},
});
