const BaseDispatchAction = require('BaseDispatchAction');
// Load data reads a property off the promotion data to determine what action to perform
// In a preview environment, just show a direct alert explaining what should happen when configured properly
const LoadData = require('LoadDataV2')
.mixinProperty({
	promotionCTA: {
		action: 'showDirectAlert',
		data: {
			title: 'Test CTA Pressed',
			text: 'This button action will do something different when attached to a promotion that supports this action',
			RightButton: {
				title: 'Okay',
			},
		},
	},
});

cc.Class({
	extends: BaseDispatchAction,
	mixins: [LoadData],

	editor: {
		menu: 'Add Button Action/Promotion CTA',
		disallowMultiple: true,
	},

	properties: {
		// Action and data will be determined dynamically from load data's "promotionCTA" field
		_actionName:{
			default: 'promotionCTA',
			override: true,
			readonly: false,
		},
	},

	onLoad() {
		this._super();
		this._actionName = this.loadData.promotionCTA.action;
	},

	getDataObject() {
		return this.loadData.promotionCTA.data;
	},
});
