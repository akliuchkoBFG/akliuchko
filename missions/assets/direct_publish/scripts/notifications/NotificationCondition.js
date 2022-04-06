/* eslint-disable no-unused-vars */
const TAG = "NotificationCondition";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	properties: {
	},

	shouldSchedule(inputData) {
		this.log.e("Unimplemented shouldSchedule function in NotificationCondition subclass " + cc.js.getClassName(this));
		return false;
	},
});
