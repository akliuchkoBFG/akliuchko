// Interface for Doober particles that require loading, configuration, or extra logic when they are emitted
cc.Class({
	extends: cc.Component,

	editor: {
		disallowMultiple: true,
	},

	// Interface for doing particle preloading (typically before the system start emitting)
	loadParticle(data) {
		return Promise.resolve();
	},

	emit() {
	},
});
