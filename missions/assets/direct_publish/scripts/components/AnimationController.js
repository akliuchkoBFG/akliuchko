const TAG = "AnimationController";
const ComponentLog = require('ComponentSALog')(TAG);

const AnimationAction = require('AnimationAction');

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.Animation,
		menu: 'Miscellaneous/Animation Controller',
	},

	properties: {
		animationName: {
			default: "",
			notify: !CC_EDITOR && function() {
				if (this._currentAnimation !== this.animationName) {
					this._needsUpdate = true;
				}
				this._currentAnimation = this.animationName;
			},
			tooltip: "Animation name for playing a specific animation from a parent animation. Use a keyframe for the animationName property from the parent CCAnimation",
		},
		animationActions: {
			default: [],
			type: [AnimationAction],
			tooltip: "(Optional) actions to run on certain animation events",
		},
	},

	onLoad() {
		this._anim = this.getComponent(cc.Animation);
	},

	onEnable() {
		this.animationActions.forEach((animAction) => {
			animAction.registerWithComponent(this._anim);
		});
	},

	play(event, animName) {
		if (!this._anim) {
			// Component may be inactive
			return;
		}
		if (!this._anim.getAnimationState(animName)) {
			this.log.w("No animation to play with name: " + animName);
			return;
		}
		this._anim.play(animName);
	},

	update() {
		if (!this._needsUpdate) {
			return;
		}
		this._needsUpdate = false;
		this.play(null, this._currentAnimation);
	},

	playAdditive(event, animName) {
		if (!this._anim) {
			// Component may be inactive
			return;
		}
		if (!this._anim.getAnimationState(animName)) {
			this.log.w("No animation to play with name: " + animName);
			return;
		}
		this._anim.playAdditive(animName);
	},

	onDisable() {
		this.animationActions.forEach((animAction) => {
			animAction.unregisterWithComponent(this._anim);
		});
	},
});
