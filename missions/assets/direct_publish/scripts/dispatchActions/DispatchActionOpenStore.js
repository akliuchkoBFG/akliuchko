/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Buttons/Open Store',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'showProducts',
			override: true,
			readonly: true,
		},
	},
});
