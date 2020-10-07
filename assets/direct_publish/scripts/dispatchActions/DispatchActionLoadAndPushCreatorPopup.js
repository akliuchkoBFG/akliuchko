const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Open Creator Popup',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'loadAndPushCCPopup',
			override: true,
			readonly: true,
		},
		// SAKit expects this to be just 'name', but that is an existing property key on cc.Component
		popupName: {
			default: '',
			tooltip: "Fully qualified name of the popup in Cocos Creator. i.e. features.collections.chests",
		},
	},

	onLoad() {
		this._super();
	},

	getDataObject() {
		const dataObj = {name: this.popupName};
		return dataObj;
	},
});
