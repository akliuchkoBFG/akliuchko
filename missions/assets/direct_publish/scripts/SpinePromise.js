const DEFAULT_ANIMATION_OPTIONS = {
	setToSetupPose: true,
	trackIndex: 0,
};

const NullSpineComponent = Object.freeze({__classname__:'NullSpineComponent'});

const SpinePromise = Object.create(null, {});
Object.assign(SpinePromise, {
	NullSpineComponent: NullSpineComponent,

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

		component.node.active = true;
		component.setAnimation(0, name, false);
		const promise = new Promise((resolve, reject) => {
			// Complete listener also called at the end of every loop
			component.setCompleteListener(resolve);
			// Either of these listeners being triggered before the complete listener indicates an animation that failed to play to completion
			component.setInterruptListener(reject);
			component.setEndListener(reject);
		}).finally(() => {
			// Clear out event listeners when the promise is fulfilled
			component.setCompleteListener(null);
			component.setInterruptListener(null);
			component.setEndListener(null);
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

		component.node.active = true;
		component.setAnimation(animationOpts.trackIndex, name, true);
		const promise = new Promise((resolve, reject) => {
			let loops = 0;
			// Complete listener also called at the end of every loop
			component.setCompleteListener(() => {
				loops++;
				// TODO: needs loopTime to completely match the AnimationPromise interface
				if (loopCondition(loops)) {
					resolve();
				}
			});
			// Either of these listeners being triggered before the complete listener indicates an animation that failed to play to completion
			component.setInterruptListener(reject);
			component.setEndListener(reject);
		}).finally(() => {
			// Clear out event listeners when the promise is fulfilled
			component.setCompleteListener(null);
			component.setInterruptListener(null);
			component.setEndListener(null);
		});
		return promise;
	},

});

module.exports = SpinePromise;
