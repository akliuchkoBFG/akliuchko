const AnimationEvent = cc.Enum({
	play: 1,
	stop: 2,
	pause: 3,
	resume: 4,
	lastframe: 5,
	finished: 6,
});

// Class for handling triggering component actions from CCAnimation events
module.exports = cc.Class({
	name: "AnimationAction",
	properties: {
		event: {
			default: AnimationEvent.stop,
			type: AnimationEvent,
		},
		animName: "",
		action: {
			default: function() {
				return new cc.Component.EventHandler();
			},
			type: cc.Component.EventHandler,
		},
	},

	registerWithComponent(animComponent) {
		const eventType = AnimationEvent[this.event];
		animComponent.on(eventType, this.onAnimationEvent, this);
	},

	onAnimationEvent(evt) {
		const animState = evt.detail;
		if (this.animName === animState.name) {
			this.action.emit([evt]);
		}
	},

	unregisterWithComponent(animComponent) {
		const eventType = AnimationEvent[this.event];
		animComponent.off(eventType, this.onAnimationEvent, this);
	},
});
