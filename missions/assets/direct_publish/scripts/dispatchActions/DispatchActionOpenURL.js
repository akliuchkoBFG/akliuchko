/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Buttons/Open URL',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'goToURL',
			override: true,
			readonly: true,
		},
		url: {
			default: '',
			displayName: "URL",
			tooltip: "URL to launch in a new window",
		},
	},

	onLoad() {
		this._super();
		this._dataPropertyKeys = ['url'];
	},
});
