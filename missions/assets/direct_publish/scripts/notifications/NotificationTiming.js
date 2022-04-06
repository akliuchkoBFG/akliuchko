/* eslint-disable no-unused-vars */
const TAG = "NotificationTiming";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	properties: {
	},

	getSecondsInFuture(inputData) {
		this.log.e("Unimplemented getSecondsInFuture function in NotificationTiming subclass " + cc.js.getClassName(this));
		return false;
	},
});
