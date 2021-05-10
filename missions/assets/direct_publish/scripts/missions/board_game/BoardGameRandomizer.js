const TAG = "BoardGameRandomizer";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],
	properties: {
	},

	startSequence() {
		// Optional entry point for latency hiding
		// Override to start the randomization sequence if supported
		// e.g. start animating and play a seamless loop until claim completes
	},

	finishSequence(targetTile, numSpaces) {
		// Override to provide behavior for finishing a randomization sequence
		// e.g. wait for loop to cycle then play an outro that shows the desired result
	},
});
