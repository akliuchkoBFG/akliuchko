const DEFAULT_ANIMATION_OPTIONS = {
	setToSetupPose: true,
	trackIndex: 0,
	timeScale: 1,
};

const NullSpineComponent = Object.freeze({__classname__:'NullSpineComponent'});

// Create a rejection error to identify animations stopped before finishing
const AnimationStopped = function (name) {
	this.message = "Spine animation " + name + " stopped before finishing";
	this.animName = name;
	this.name = "SpineAnimationStopped";
};
AnimationStopped.prototype = Object.create(Error.prototype);


const SpinePromise = Object.create(null, {});
Object.assign(SpinePromise, {
	NullSpineComponent: NullSpineComponent,
	AnimationStopped: AnimationStopped,

	// Play an animation on the component returning a promise when the animation completes
	play(component, name, animationOpts) {
		if (component === NullSpineComponent) {
			return Promise.resolve();
		}
		if (!(component instanceof sp.Skeleton)) {
			return Promise.reject(new Error("[SpinePromise] Tried to play a non-spine animation"));
		}
		animationOpts = _.defaults(animationOpts || {}, DEFAULT_ANIMATION_OPTIONS);
		component.clearTracks();
		if (animationOpts.setToSetupPose) {
			component.setToSetupPose();
		}

		// TODO: Using a single callback for all listeners doesn't allow for overlapping animations on different tracks
		// Should be reimplemented to add and remove listeners from a list that is aggregated in a single callback
		//  that can be used to dispatch events to multiple listeners for the same skelton component
		const clearListeners = function() {
			component.setCompleteListener(null);
			component.setInterruptListener(null);
			component.setEndListener(null);
		};

		component.node.active = true;
		component.setAnimation(animationOpts.trackIndex, name, false);
		component.timeScale = animationOpts.timeScale;
		const promise = new Promise((resolve, reject) => {
			// Complete listener also called at the end of every loop
			component.setCompleteListener(() => {
				clearListeners();
				resolve();
			});
			// Either of these listeners being triggered before the complete listener indicates an animation that failed to play to completion
			component.setInterruptListener(() => {
				clearListeners();
				reject(new AnimationStopped(name));
			});
			component.setEndListener(() => {
				clearListeners();
				reject(new AnimationStopped(name));
			});
		});
		return promise;
	},

	loopUntil(component, name, loopCondition, animationOpts) {
		if (component === NullSpineComponent) {
			return Promise.resolve();
		}
		if (!(component instanceof sp.Skeleton)) {
			return Promise.reject(new Error("[SpinePromise] Tried to play a non-spine animation"));
		}
		// Create a basic loop condition for finishing after a certain number of loops
		if (typeof loopCondition !== 'function') {
			const targetLoops = loopCondition;
			loopCondition = function(loops) {
				return loops >= targetLoops;
			};
		}

		animationOpts = _.defaults(animationOpts || {}, DEFAULT_ANIMATION_OPTIONS);
		component.clearTracks();
		if (animationOpts.setToSetupPose) {
			component.setToSetupPose();
		}

		// TODO: Using a single callback for all listeners doesn't allow for overlapping animations on different tracks
		// Should be reimplemented to add and remove listeners from a list that is aggregated in a single callback
		//  that can be used to dispatch events to multiple listeners for the same skelton component
		const clearListeners = function() {
			component.setCompleteListener(null);
			component.setInterruptListener(null);
			component.setEndListener(null);
		};

		component.node.active = true;
		component.setAnimation(animationOpts.trackIndex, name, true);
		component.timeScale = animationOpts.timeScale;
		const promise = new Promise((resolve, reject) => {
			let loops = 0;
			// Complete listener also called at the end of every loop
			component.setCompleteListener(() => {
				loops++;
				// TODO: needs loopTime to completely match the AnimationPromise interface
				if (loopCondition(loops)) {
					clearListeners();
					resolve();
				}
			});
			// Either of these listeners being triggered before the complete listener indicates an animation that failed to play to completion
			component.setInterruptListener(() => {
				clearListeners();
				reject(new AnimationStopped(name));
			});
			component.setEndListener(() => {
				clearListeners();
				reject(new AnimationStopped(name));
			});
		});
		return promise;
	},

	sample(component, name, animationOpts) {
		if (component === NullSpineComponent) {
			return Promise.resolve();
		}
		if (!(component instanceof sp.Skeleton)) {
			return Promise.reject(new Error("[SpinePromise] Tried to sample a non-spine animation"));
		}
		animationOpts = animationOpts || {};
		animationOpts = _.defaults(animationOpts || {}, DEFAULT_ANIMATION_OPTIONS);
		component.clearTracks();
		if (animationOpts.setToSetupPose) {
			component.setToSetupPose();
		}

		// Show the first frame
		component.node.active = true;
		component.setAnimation(animationOpts.trackIndex, name, true);
		// Pause on first frame
		component.timeScale = 0;
		return Promise.resolve();
	},

});

module.exports = SpinePromise;
