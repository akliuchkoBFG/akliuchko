/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Buttons/Open Club Menu',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'openClubMenu',
			override: true,
			readonly: true,
		},
	},
});
