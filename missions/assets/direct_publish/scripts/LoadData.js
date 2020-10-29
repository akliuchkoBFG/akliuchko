/* LoadData
	View load data property definition helper
	Defines mock data for preview scene and gets the viewData that should be passed in at runtime
	Popup Example:
		SAWindowLayer.getInstance().loadAndPushCreatorPopup({
			name: "features.myFeature.myScene",
			viewData: {
				myRequiredProp: 100,
			},
		});
	Component Usage: 
		const LoadData = require('LoadData');
		cc.Class({
			extends: cc.Component,
			…
			properties: {
				loadData: LoadData.defineProperty({
					// Mock data: declare the properties and placeholder values expected in load data
					// These will be used in the SAKit Preview scene when previewing from the editor
					myRequiredProp: 42,
				})
			},

			onLoad() {
				// Will be 42 in SAKit Preview, but will pull from viewData when it is provided at runtime
				console.log(this.loadData.myRequiredProp);
			},
			…
		});
*/

const SceneUtil = require('SceneUtil');

module.exports = Object.freeze({
	defineProperty(mockData) {
		return {
			get() {
				if (!this.__loadData) {
					// View load data is stored on the cc.Scene for a given CreatorView
					const scene = SceneUtil.getScene(this.node);
					this.__loadData = (scene && scene.viewData) || mockData || {};
				}
				return this.__loadData;
			},
			visible: false,
		};
	},
});
