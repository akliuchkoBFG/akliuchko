const TAG = 'SagaStepBase';
const ComponentLog = require('ComponentSALog')(TAG);
const BaseMissionStepComponent = require('BaseMissionStepComponent');

function abstractMessage(functionName) {
	return 'Unimplemented function from abstract class: ' + functionName;
}

// SagaStepBase is an abstract class that provides a shared common function interface for saga steps
// These functions should be implemented in all components that manage the saga step state
// e.g. SagaStep, SagaStepZoneReward
cc.Class({
	extends: BaseMissionStepComponent,

	mixins: [ComponentLog, cc.EventTarget],

	/* events
		saga-step.unlocked
			emitted after unlock animation choreography completes
		saga-step.reset-to-locked
			emitted when locking the step (typically to allow for playing unlock choreography on an active step)
		saga-step.claim-pressed
			emitted when pressing the claim button
		saga.step-changed
			emitted when changing the selected step on the saga map
	*/

	properties: {
	},

	// Reset the step to a locked state
	resetToLocked() {
		this.log.e(abstractMessage('resetToLocked'));
	},

	// Button action for claiming step reward
	claimPressed() {
		this.log.e(abstractMessage('claimPressed'));
	},

	// Step specific claim choreography that integrates into the overall step reward claim flow
	// Returns a promise that represents when the step choreography is complete
	// This can happen at different points in the claim flow depending on the step type
	onClaimAction() {
		this.log.e(abstractMessage('onClaimAction'));
		return Promise.resolve();
	},

	// Play step unlock choreography
	// Returns a promise that represents when the unlock choreography is complete
	doUnlock() {
		this.log.e(abstractMessage('doUnlock'));
		return Promise.resolve();
	},
});
