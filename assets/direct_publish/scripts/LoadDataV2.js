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
		const LoadData = require('LoadDataV2').mixinProperty({
			// Mock data: declare the properties and placeholder values expected in load data
			// These will be used in the SAKit Preview scene when previewing from the editor
			myRequiredProp: 42,
		});
		cc.Class({
			extends: cc.Component,
			mixins: [LoadData],
			…
			onLoad() {
				// Will be 42 in SAKit Preview, but will pull from viewData when it is provided at runtime
				console.log(this.loadData.myRequiredProp);
			},
			…
		});
*/

const SceneUtil = require('SceneUtil');

function _setPreviewLoadData(mockData) {
	if (!CC_EDITOR) {
		return;
	}
	Editor.Ipc.sendToMain('sakit-preview-server:add-load-data', mockData);
}

module.exports = Object.freeze({

	// Deprecated V1 interface
	// This property is still functional at runtime, but will generally fail to provide mock load data in the previewer
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

	// Mixin defines the same property and sends the preview message at construct time
	// (only happens when a component is created in the scene)
	mixinProperty(mockData) {
		return cc.Class({
			properties: {
				loadData: {
					get() {
						if (!this.__loadData) {
							// View load data is stored on the cc.Scene for a given CreatorView
							const scene = SceneUtil.getScene(this.node);
							this.__loadData = (scene && scene.viewData) || mockData || {};
						}
						return this.__loadData;
					},
					visible: false,
				}
			},

			ctor() {
				_setPreviewLoadData(mockData);
			},
		});
	},

	mixinExpectedProperties(propNames) {
		return cc.Class({
			properties: {
				loadData: {
					get() {
						if (!this.__loadData) {
							// View load data is stored on the cc.Scene for a given CreatorView
							const scene = SceneUtil.getScene(this.node);
							this.__loadData = (scene && scene.viewData) || {};
							// Warn at runtime if any expected properties are missing
							if (!CC_EDITOR) {
								const definedKeys = Object.keys(this.__loadData);
								propNames.forEach((propName) => {
									if (definedKeys.indexOf(propName) === -1) {
										SALog.w("Load data missing expected key: " + propName, "CreatorLoadData");
									}
								});
							}
						}
						return this.__loadData;
					},
					visible: false,
				}
			},
		});
	}
});
