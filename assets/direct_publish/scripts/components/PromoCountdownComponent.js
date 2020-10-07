const CountdownComponent = require('CountdownComponent');

const LoadData = require('LoadDataV2')
.mixinProperty({
	secondsRemaining: 3000,
});

cc.Class({
	extends: CountdownComponent,
	mixins: [LoadData],
	editor: CC_EDITOR && {
		menu: 'Add Marketing Component/PromoCountdown',
	},

	properties: {
	},

	// use this for initialization
	onLoad: function () {
		this._super();
		if (this.loadData.secondsRemaining) {
			this._endTime = Date.now() + this.loadData.secondsRemaining * 1000;
		}
	},
});