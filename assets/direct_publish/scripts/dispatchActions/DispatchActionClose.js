/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Close',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'close',
			override: true,
			readonly: true,
		},
	},
});
