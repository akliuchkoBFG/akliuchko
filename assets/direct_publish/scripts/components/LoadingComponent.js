
// Component to add "Loading Task" functionality to Creator Views
cc.Class({
	extends: cc.Component,

	properties: {
	},

	statics: {
		addLoadingTask: function addLoadingTask(target, promise) {
			const loadingComponent = target.node.addComponent("LoadingComponent");
			loadingComponent._loadingPromise = promise;
		}
	},

	onLoad: function() {
		this._loadingTask = null;
		this._loadingPromise = null;
	},

	getLoadingPromise: function() {
		return this._loadingPromise || Promise.resolve();
	},


});