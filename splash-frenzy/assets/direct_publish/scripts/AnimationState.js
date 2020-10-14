module.exports = cc.Class({
	name: 'AnimationStateProperty',
	properties: {
		component: {
			default: null,
			type: cc.Animation,
		},
		clipName: {
			default: '',
			tooltip: 'Name of the animation clip this state references',
		},
		valid: {
			get() {
				return !!this.component && !!this.component.getAnimationState(this.clipName);
			},
			type: 'Boolean',
			tooltip: 'Component and clip name map to a valid animation state',
		},
	},

	play() {
		if (!this.valid) {
			return;
		}
		this.component.play(this.clipName);
	},

	playAdditive() {
		if (!this.valid) {
			return;
		}
		this.component.playAdditive(this.clipName, 0);
	},
});
