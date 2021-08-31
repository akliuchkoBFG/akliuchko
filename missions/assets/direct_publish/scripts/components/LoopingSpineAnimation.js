const TAG = 'LoopingSpineAnimation';
const ComponentLog = require('ComponentSALog')(TAG);
const SpineStateProperty = require('SpineStateProperty');
const SpinePromise = require('SpinePromise');

const SPINE_STATE_NAMES = [
	'intro',
	'loop',
	'outro',
];

const SKELETON_COMPONENT_PROP = 'skeleton';

/*
 * LoopingSpineAnimation is a generic way to play a spine anim with an intro, loop,
 * and outro. Animation will start when enabled and stop when disabled.
 * immediateOutro can be enabled so that outro will interrupt the loop to play
 */
cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Add Custom Component/LoopingSpineAnimation',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
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

		intro: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'start',
			'Intro'
		),
		loop: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'loop',
			'Loop'
		),
		outro: SpineStateProperty.propertyDefinition(
			SKELETON_COMPONENT_PROP,
			'end',
			'Outro'
		),
		immediateOutro: {
			default: false,
			tooltip: "Enable if you want outro to interrupt the current loop instead of waiting for a seamless loop before playing",
		}
	},

	__preload:SpineStateProperty.createPreloadFunction(SPINE_STATE_NAMES),

	// use this for initialization
	onLoad() {
		this.loopFinished = false;
	},

	onEnable() {
		if(this.outroPromise){
			this.outroPromise.cancel();
		}
		this.loopFinished = false;
		this.loopPromise = this.intro.play()
		.then(() => {
			if (!this.loopFinished) {
				const animOpts = {
					setToSetupPose: false,
				};
				return this.loop.loopUntil(() => {
					return this.loopFinished;
				}, animOpts);
			}
		})
		.catch(SpinePromise.AnimationStopped, () => {
			// Intentionally empty, intro animation may be interrupted
		});
	},

	onDisable() {
		this.loopFinished = true;
		if (this.immediateOutro) {
			this.outroPromise = this.outro.play();
		} else {
			const animOpts = {
				setToSetupPose: false,
			};
			this.outroPromise = this.loopPromise.then(() => {
				return this.outro.play(animOpts);
			});
		}
		this.outroPromise.catch(SpinePromise.AnimationStopped, () => {
			// Intentionally empty, outro animation may be interrupted
		});
	},
});
