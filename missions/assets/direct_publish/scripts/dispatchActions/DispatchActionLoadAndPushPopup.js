/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Buttons/Open Melonpig Popup',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'loadAndPushPopup',
			override: true,
			readonly: true,
		},
		viewSet: {
			default: '',
			tooltip: "View set of the layout in Melonpig",
		},
		viewName: {
			default: '',
			tooltip: "View name of the layout in Melonpig",
		},
		viewData: {
			default: '',
			multiline: true,
			tooltip: "(Optional) JSON string of data that will be sent to the view controller. If you don't know what this is for, you probably don't need it",
		},
	},

	onLoad() {
		this._super();
		this._dataPropertyKeys = ['viewSet', 'viewName', 'viewData'];
	},

	getDataObject() {
		const dataObj = this._super();
		if (dataObj.viewData) {
			try {
				dataObj.viewData = JSON.parse(dataObj.viewData);
			} catch(err) {
				console.error(err);
				dataObj.viewData = null;
			}
		}
		return dataObj;
	},
});
