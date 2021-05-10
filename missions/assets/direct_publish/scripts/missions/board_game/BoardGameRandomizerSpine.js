const TAG = "BoardGameRandomizerSpine";
const ComponentLog = require('ComponentSALog')(TAG);

const BoardGameRandomizer = require('BoardGameRandomizer');
const SpineStateProperty = require('SpineStateProperty');
const SPINE_STATE_NAMES = [
	'startState',
	'loopState',
	'stopState',
];
const SKELETON_COMPONENT_PROP = 'skeleton';

cc.Class({
	extends: BoardGameRandomizer,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Board Game/Randomizer – Spine',
		executeInEditMode: true,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	mixins: [ComponentLog],
	properties: {
		skinPrefix: {
			default: 'result_',
			tooltip: 'Prefix for spine skin names used to simulate target result. e.g. "result_1" for moving one space',
		},
		skeleton: SpineStateProperty.spSkeletonForProperties(
			SKELETON_COMPONENT_PROP,
			SPINE_STATE_NAMES,
			[
				'Skeleton component for board game randomizer state animations',
				'Adding this component will reveal states for intro, loop, and outro',
			].join('\n')
		),
		startState: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'(Optional) Animation state for starting the randomization sequence before the result is known'
		),
		loopState: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'(Optional) Animation state for looping the randomization sequence while waiting for the result'
		),
		stopState: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			[
				'(Required) Animation state for ending the sequence to show the result',
				'If no start/loop states are defined, this state should capture the entire sequence',
				'Forced result is simulated using skins, see "Skin Prefix"'
			].join('\n')
		),
	},

	__preload:SpineStateProperty.createPreloadFunction(SPINE_STATE_NAMES),

	startSequence() {
		// Optional entry point for latency hiding
		// Override to start the randomization sequence if supported
		// e.g. start animating and play a seamless loop until claim completes
		const animOpts = {
			setToSetupPose: false,
		};
		this._finishSequence = false;
		this._loopingIntro = this.startState.play(animOpts)
		.then(() => {
			return this.loopState.loopUntil(() => {
				return this._finishSequence;
			}, animOpts);
		});
		return this._loopingIntro;
	},

	finishSequence(targetTile, numSpaces) {
		// Override to provide behavior for finishing a randomization sequence
		// e.g. wait for loop to cycle then play an outro that shows the desired result
		if (!this._loopingIntro) {
			this.log.d("Attempted to finish randomizer sequence without starting it");
			this.startSequence();
		}
		this._finishSequence = true;
		// Force the result by modifying the skin
		const resultSkinName = this.skinPrefix + numSpaces;
		const success = this.skeleton.setSkin(resultSkinName);
		if (!success) {
			this.log.e("Skin not found: " + resultSkinName);
			// TODO: Error handling? This might be bad enough to surface to user and bail from the sequence
		}
		return this._loopingIntro
		.then(() => {
			const animOpts = {
				setToSetupPose: false,
			};
			return this.stopState.play(animOpts);
		}).finally(() => {
			this._loopingIntro = null;
		});
	},
});
