const SpinePromise = require('SpinePromise');

const DefaultAnimsEnum = cc.Enum({ '<None>': 0 });

const SpineStateProperty = cc.Class({
	name: 'SpineStateProperty',
	statics: {
		// Define a function to call as __preload from parent component or from within an existing __preload
		// e.g.
		// __preload: SpineStateProperty.createPreloadFunction(STATE_NAMES_ARRAY)
		//  OR
		// __preload() {
		// 	// Preload logic
		// 	SpineStateProperty.createPreloadFunction(STATE_NAMES_ARRAY).call(this);
		// },
		createPreloadFunction(statePropNames) {
			return function() {
				if (Array.isArray(statePropNames)) {
					statePropNames.forEach((stateProp) => {
						if (this[stateProp] instanceof SpineStateProperty) {
							this[stateProp].__preload();
						} else {
							Editor.warn("Missing spine state prop for state name: " + stateProp);
						}
					});
				}
			};
		},
		// Define a skeleton property that automatically updates the skeleton on state properties
		spSkeletonForProperties(propName, statePropNames, tooltip) {
			return {
				default: null,
				type: sp.Skeleton,
				tooltip: tooltip,
				notify() {
					if (Array.isArray(statePropNames)) {
						statePropNames.forEach((stateProp) => {
							if (this[stateProp] instanceof SpineStateProperty) {
								this[stateProp]._skeleton = this[propName];
							}
						});
					}
				},
			};
		},
		// Define a state property that is only visible if the skeleton property is configured
		propertyDefinition(spSkeletonName, tooltip, displayName) {
			const prop = {
				default: function() {
					return new SpineStateProperty();
				},
				type: SpineStateProperty,
				tooltip: tooltip,
				visible() {
					return this[spSkeletonName] instanceof sp.Skeleton;
				},
			};
			if (displayName) {
				prop.displayName = displayName;
			}
			return prop;
		},
	},
	properties: {
		_skeleton: {
			default: null,
			type: sp.Skeleton,
			notify() {
				if (CC_EDITOR) {
					this._updateAnimEnum();
				}
			}
		},
		_stateName: {
			default: '',
		},
		animationIndex: {
			get() {
				if (this._skeleton && this._skeleton.skeletonData && this._stateName) {
					const animsEnum = this._skeleton.skeletonData.getAnimsEnum();
					if (animsEnum) {
						const animIndex = animsEnum[this._stateName];
						if (animIndex != null) {
							return animIndex;
						}
					}
				}
				return 0;
			},
			set(value) {
				if (value === 0) {
					this._stateName = '';
					return;
				}
				let animsEnum;
				if (this._skeleton && this._skeleton.skeletonData) {
					animsEnum = this._skeleton.skeletonData.getAnimsEnum();
				}
				if ( !animsEnum ) {
					return cc.errorID(7502, this.name);
				}
				const animName = animsEnum[value];
				if (animName != null) {
					this._stateName = animName;
				}
			},
			type: DefaultAnimsEnum,
			displayName: 'Animation',
		},

		// Internal tracking properties for displaying spine state names as a ui-select
		_animationIndexValues: {
			default: [],
			type: [cc.Integer],
			editorOnly: true,
		},
		_animationIndexNames: {
			default: [],
			type: [cc.String],
			editorOnly: true,
		},
	},

	_updateAnimEnum: CC_EDITOR && function () {
		let animEnum = DefaultAnimsEnum;
		if (this._skeleton && this._skeleton.skeletonData) {
			animEnum = this._skeleton.skeletonData.getAnimsEnum();
		}
		const enumList = cc.Enum.getList(animEnum);
		this._animationIndexNames = enumList.map((entry) => entry.name);
		this._animationIndexValues = enumList.map((entry) => entry.value);
	},

	// Should be called in parent component's __preload method (see SpineStateProperty.createPreloadFunction)
	__preload() {
		if (CC_EDITOR) {
			this._updateAnimEnum();
		}
	},

	play(animationOpts) {
		let skeleton = this._skeleton;
		if (!this._skeleton || !this._stateName) {
			skeleton = SpinePromise.NullSpineComponent;
		}
		return SpinePromise.play(skeleton, this._stateName, animationOpts);
	},

	loopUntil(loopCondition, animationOpts) {
		let skeleton = this._skeleton;
		if (!this._skeleton || !this._stateName) {
			skeleton = SpinePromise.NullSpineComponent;
		}
		return SpinePromise.loopUntil(skeleton, this._stateName, loopCondition, animationOpts);
	},

	sample(animationOpts) {
		let skeleton = this._skeleton;
		if (!this._skeleton || !this._stateName) {
			skeleton = SpinePromise.NullSpineComponent;
		}
		return SpinePromise.sample(skeleton, this._stateName, animationOpts);
	},
});
module.exports = SpineStateProperty;
