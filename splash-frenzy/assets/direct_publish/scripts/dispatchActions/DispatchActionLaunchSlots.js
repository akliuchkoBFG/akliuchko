/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Launch Slots',
		inspector: 'packages://self-aware-components/components/dispatch-action-launch-slots.js',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'launchSlots',
			override: true,
			readonly: true,
		},
		buyInID: {
			default: 152,
			min: 1,
			max: 10000,
			step: 1,
			displayName: "Buy in ID",
			tooltip: "Buy in ID for the slot machine to launch",
		},
		theme2_1: {
			default: 'jpcnew',
			tooltip: "Corresponding theme for the slot machine",
			displayName: "Intro Theme",
		},
		layoutViewSet: {
			default: '',
			tooltip: '(OLD MACHINES) this property will only be populated when selecting certain older style slot machines',
			displayName: '[OLD] View Set',
		},
		layoutViewName: {
			default: '',
			tooltip: '(OLD MACHINES) this property will only be populated when selecting certain older style slot machines',
			displayName: '[OLD] View Name',
		},
		introViewSet: {
			default: '',
			tooltip: '(OLD MACHINES) this property will only be populated when selecting certain older style slot machines',
			displayName: '[OLD] Intro',
		},
	},

	onLoad() {
		this._super();
		this._dataPropertyKeys = ['buyInID', 'theme2_1', 'layoutViewSet', 'layoutViewName', 'introViewSet'];
	},
});
