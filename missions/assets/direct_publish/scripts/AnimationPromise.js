// Create a dummy animation component object for turning animation steps into no-ops
const NullAnimationComponent = Object.freeze({__classname__:'NullAnimationComponent'});

// Create a rejection error to identify animations stopped before finishing
const AnimationStopped = function (name, duration, time) {
	this.message = "Animation " + name + " stopped " + (duration - time) + " seconds before finishing";
	this.duration = duration;
	this.time = time;
	this.animName = name;
	this.name = "AnimationStopped";
};
AnimationStopped.prototype = Object.create(Error.prototype);

// Create a rejection error to identify missing animations
const AnimationNotFound = function (name) {
	this.message = "No animation for " + name;
	this.name = "AnimationNotFound";
};
AnimationNotFound.prototype = Object.create(Error.prototype);

// Create a rejection error to identify failed attempts to play a looping animation
const AnimationNotLooping = function (name) {
	this.message = "Animation state " + name + " does not loop";
	this.name = "AnimationNotLooping";
};
AnimationNotLooping.prototype = Object.create(Error.prototype);

// A null animation play promise instantly resolves, but also supports the skipToEnd interface
const NullAnimationPlay = Promise.resolve();
NullAnimationPlay.skipToEnd = function() {};

const AnimationPromise = Object.create(null, {});
Object.assign(AnimationPromise, {
	NullAnimationComponent: NullAnimationComponent,
	NullAnimationPlay: NullAnimationPlay,
	Stopped: AnimationStopped,
	NotFound: AnimationNotFound,
	NotLooping: AnimationNotLooping,

	// Internal logic for wrapping an animation in a promise
	// playMode is one of ['play', 'playAdditive']
	_play(playMode, component, name, startTime) {
		if (playMode !== 'play' && playMode !== 'playAdditive') {
			// Invalid arguments internal rejection
			return Promise.reject(new Error('AnimationPromise: invalid play mode'));
		}
		if (component === NullAnimationComponent) {
			return NullAnimationPlay;
		}
		let state, onStop;
		let skipped = false;
		const skipToEnd = function() {
			if (state) {
				component.setCurrentTime(state.duration);
			} else {
				skipped = true;
			}
		};
		const promise = new Promise(function(resolve, reject) {
			// Animation component has two separate events for stop and finished, but unfortunately stop also triggers on finish
			onStop = function (evt) {
				const animState = evt.detail;
				if (animState.name !== name) {
					return;
				}
				if (animState.time >= animState.duration) {
					resolve();
				} else {
					reject(new AnimationStopped(animState.name, animState.duration, animState.time));
				}
			};
			component.on('stop', onStop);
			state = component[playMode](name, startTime);
			// Animation state returned is null if there was no animation found to play (and a default was not used)
			if (!state) {
				reject(new AnimationNotFound(name));
			} else if (skipped) {
				skipToEnd();
			}
		}).finally(function() {
			component.off('stop', onStop);
		});

		promise.skipToEnd = skipToEnd;
		return promise;
	},

	// Internal logic for wrapping a looping animation in a promise
	// playMode is one of ['play', 'playAdditive']
	// loopCondition is an integer desired number of loops or a function that returns true to stop the looping animation
	_loopUntil(playMode, component, name, loopCondition, startTime) {
		if (playMode !== 'play' && playMode !== 'playAdditive') {
			// Invalid arguments internal rejection
			return Promise.reject(new Error('AnimationPromise: invalid play mode'));
		}
		if (component === NullAnimationComponent) {
			return NullAnimationPlay;
		}
		// Create a basic loop condition for finishing after a certain number of loops
		if (typeof loopCondition !== 'function') {
			const targetLoops = loopCondition;
			loopCondition = function(loops) {
				return loops >= targetLoops;
			};
		}
		let state, onStop, onLastFrame;
		let skipped = false;
		const skipToEnd = function() {
			if (state) {
				component.setCurrentTime(state.duration);
				loopCondition = function() { return true; };
			} else {
				skipped = true;
			}
		};
		const promise = new Promise(function(resolve, reject) {
			let loopCount = 0, loopTime = 0;
			// Animation component has two separate events for stop and finished, but unfortunately stop also triggers on finish
			onStop = function (evt) {
				const animState = evt.detail;
				reject(new AnimationStopped(animState.name, animState.duration, animState.time));
			};
			component.on('stop', onStop);
			onLastFrame = function (evt) {
				const animState = evt.detail;
				loopCount++;
				loopTime += animState.duration;
				if (loopCondition(loopCount, loopTime)) {
					resolve();
					component.stop(name);
				}
			};
			component.on('lastframe', onLastFrame);
			state = component[playMode](name, startTime);
			// Animation state returned is null if there was no animation found to play (and a default was not used)
			if (!state) {
				reject(new AnimationNotFound(name));
			} else if (state.repeatCount !== Infinity) {
				reject(new AnimationNotLooping(name));
			} else if (skipped) {
				skipToEnd();
			}
		}).finally(function() {
			component.off('stop', onStop);
			component.off('lastframe', onLastFrame);
		});

		promise.skipToEnd = skipToEnd;
		return promise;
	},

	// Play an animation on the component returning a promise when the animation completes
	play(component, name, startTime) {
		return this._play('play', component, name, startTime);
	},

	// Play an animation additively on the component returning a promise when the animation completes
	playAdditive(component, name, startTime) {
		return this._play('playAdditive', component, name, startTime);
	},

	// Helper to setup an animation to play at a later time
	// Example Usage:
	// Promise.resolve().then(AnimationPromise.playOnResolve(component, name, startTime));
	playOnResolve(component, name, startTime) {
		return function() {
			return AnimationPromise.play(component, name, startTime);
		};
	},

	// Helper to setup an animation to play additively at a later time
	// Example Usage:
	// Promise.resolve().then(AnimationPromise.playAdditiveOnResolve(component, name, startTime));
	playAdditiveOnResolve(component, name, startTime) {
		return function() {
			return AnimationPromise.playAdditive(component, name, startTime);
		};
	},

	loopUntil(component, name, loopCondition, startTime) {
		return AnimationPromise._loopUntil('play', component, name, loopCondition, startTime);
	},

	loopAdditiveUntil(component, name, loopCondition, startTime) {
		return AnimationPromise._loopUntil('playAdditive', component, name, loopCondition, startTime);
	},
});

module.exports = AnimationPromise;
