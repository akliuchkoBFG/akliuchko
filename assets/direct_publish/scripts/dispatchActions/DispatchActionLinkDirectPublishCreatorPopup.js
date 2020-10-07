
// TODO: This was aquick and dirty implementation to link to CC Popups w/ the intent to make it more robust
// Graphic Design continues to reqularly use this version, so its been added to the shared folder
// https://bigfishgames.atlassian.net/browse/ACASI-38688

const BaseDispatchAction = require('BaseDispatchAction');
// Load data is forwarded from this popup to the next, there's no expectations
//  for any specific properties to exist here
const LoadData = require('LoadDataV2').mixinExpectedProperties([]);

cc.Class({
	extends: BaseDispatchAction,
	mixins: [LoadData],

	editor: {
		menu: 'Add Button Action/Link Direct Publish Creator Popup',
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

		version: {
			default: '',
			tooltip: "TODO: pull from a DB and populate for now... manual version",
		},
	},

	onLoad() {
		this._super();
	},

	getDataObject() {
		// TODO: get from server
		const url = 'https://casinoinbox-a.akamaihd.net/marketingV2/popup/' + this.popupName + "/" + this.version + ".zip";
		const dataObj = {name: this.popupName, hash: this.version, url: url, viewData: this.loadData};
		return dataObj;
	},
});