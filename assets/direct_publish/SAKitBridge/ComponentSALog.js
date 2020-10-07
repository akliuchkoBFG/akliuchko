/*
	Class mixin for adding SALog functionality to Creator classes
	Closely mirrors SALog.createLogFunctions

	Usage:
	const TAG = "LoggingTag";
	const ComponentLog = require('ComponentSALog')(TAG);
	cc.Class({
		…
		mixins: [ComponentLog],
		…
		someFunction() {
			this.log.v("Verbose");
			this.log.d("Debug");
			this.log.w("warning");
			this.log.n("Notice");
			this.log.e("Error");
			this.log.e("Error with callstack", new Error().stack);
		},
		…
	});
*/
function logWithLevelAndTag(msg, logLevel, tag, callstack) {
	if (CC_EDITOR) {
		console.log(tag + " " + msg);
		return;
	}
	if (!logLevel || !SALog[logLevel]) {
		logLevel = 'd';
	}
	SALog[logLevel](msg, tag, callstack);
}

module.exports = function createMixin(tag) {
	const mixin = function() {};
	mixin.prototype.log = Object.freeze({
		v: function(msg) { logWithLevelAndTag(msg, 'v', tag); },
		d: function(msg) { logWithLevelAndTag(msg, 'd', tag); },
		n: function(msg) { logWithLevelAndTag(msg, 'n', tag); },
		w: function(msg, callstack) { logWithLevelAndTag(msg, 'w', tag, callstack); },
		e: function(msg, callstack) { logWithLevelAndTag(msg, 'e', tag, callstack); },
		// Infrequently used, unsupported here
		group: function(/* msg, items, options */) {},
	});
	return mixin;
};
