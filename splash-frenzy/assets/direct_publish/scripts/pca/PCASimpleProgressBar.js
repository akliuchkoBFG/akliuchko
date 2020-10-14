const PCABaseComponent = require('PCABaseComponent');

cc.Class({
	extends: PCABaseComponent,
	editor: CC_EDITOR && {
		menu: 'Add PCA Component/Simple Progress Bar',
		requireComponent: cc.ProgressBar,
	},

	onLoad: function() {
		this._progressBar = this.getComponent(cc.ProgressBar);
		this._progressBar.progress = 0;
		this._spinsPerEntry = this._loadData.spinsPerEntry;
		this._numSpins = this._loadData.numEntries;
	},

	_getCarryOverSpins: function() {
		return this._numSpins % this._spinsPerEntry;
	},

	_getFillPercentage: function() {
		return this._getCarryOverSpins() / this._spinsPerEntry;
	},

	update: function (dt) {
		if (this._progressBar.progress <= this._getFillPercentage()){
			this._progressBar.progress += dt;
		}
	},

});
