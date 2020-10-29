
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		menu: 'Add SAG Component/RollupLabel',
		requireComponent: cc.Label,
	},

	properties: {
		startValue: {
			default: 0,
			tooltip: 'Value used to start rollup',
		},
		rollupValue: {
			default: 0,
			tooltip: 'Value to rollup to',
		},
		rollupDuration: {
			default: 2,
			min: 0,
			tooltip: 'Rollup Duration in seconds',
		},
		paused: {
			default: false,
			animatable: true,
			tooltip: 'Rollup will not increment while this is true',
		},
	},

	onLoad: function() {
		// rollup data
		this._totalDelta = 0;
		this._currentLabelValue = 0;
		this._label = this.getComponent(cc.Label);
	},

	update: function (dt) {
		if (!this.paused) {
			this._totalDelta += dt;
		}
		this.updateLabel();
	},

	updateLabel: function() {
		const previousValue = this._currentLabelValue;
		this._currentLabelValue = Math.min(this.rollupValue, (this._totalDelta / this.rollupDuration) * (this.rollupValue - this.startValue) + this.startValue);
		if (this._currentLabelValue !== previousValue) {
			this._label.string = SAStringUtil.formatNumber(this._currentLabelValue);
		}
	},

});
