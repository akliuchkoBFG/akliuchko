/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Open Inbox',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'openInbox',
			override: true,
			readonly: true,
		},
	},
});
