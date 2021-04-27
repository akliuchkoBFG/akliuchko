const AnimationPromise = require('AnimationPromise');

const AnimationClipProperty = cc.Class({
	name: 'AnimationClipProperty',
	statics: {
		ccAnimationForProperties(propName, clipPropNames, tooltip) {
			return {
				default: null,
				type: cc.Animation,
				tooltip: tooltip,
				notify() {
					if (Array.isArray(clipPropNames)) {
						clipPropNames.forEach((animProp) => {
							if (this[animProp] instanceof AnimationClipProperty) {
								this[animProp]._animation = this[propName];
							}
						});
					}
				},
			};
		},
		propertyDefinition(ccAnimName, tooltip) {
			return {
				default: function() {
					return new AnimationClipProperty();
				},
				type: AnimationClipProperty,
				tooltip: tooltip,
				visible() {
					return this[ccAnimName] instanceof cc.Animation;
				},
			};
		},
	},
	properties: {
		_clipName: {
			default: '',
		},
		_animation: {
			default: null,
			type: cc.Animation,
		},
		_clip: {
			default: null,
			type: cc.AnimationClip,
			editorOnly: true,
		},
		animationClip: {
			get() {
				if (!this._animation || !this._clipName) {
					return null;
				}
				const animState = this._animation.getAnimationState(this._clipName);
				if (!animState || !animState.clip) {
					// Clip has been renamed or removed from the animation component
					this._clipName = '';
					return null;
				}
				return animState.clip;
			},
			set(clip) {
				if (!clip) {
					this._clip = null;
					this._clipName = '';
					return;
				}
				this._clipName = clip.name;
				this._clip = clip;
				if (this._animation) {
					this._animation.addClip(clip);
				}
			},
			type: cc.AnimationClip,
		},
	},

	play(startTime) {
		let animation = this._animation;
		if (!this._animation || !this._clipName) {
			animation = AnimationPromise.NullAnimationComponent;
		}
		return AnimationPromise.play(animation, this._clipName, startTime);
	},

	playAdditive(startTime) {
		let animation = this._animation;
		if (!this._animation || !this._clipName) {
			animation = AnimationPromise.NullAnimationComponent;
		}
		return AnimationPromise.playAdditive(animation, this._clipName, startTime);
	},

	sample() {
		if (!this._animation || !this._clipName) {
			return;
		}
		this._animation.sample(this._clipName);
	},

	isValid() {
		return !!(this._animation && this._clipName);
	},
});
module.exports = AnimationClipProperty;
