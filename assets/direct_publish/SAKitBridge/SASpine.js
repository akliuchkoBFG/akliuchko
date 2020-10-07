const TAG = 'SASpineComponent';
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: sp.Skeleton,
	},

	properties: {
		loadingView: {
			default: null,
			type: cc.Node,
			tooltip: "(Optional) Node to show while spine view is in the process of loading",
		},
		skeleton: {
			displayName: "Skeleton File",
			default: "",
			tooltip: "SAKit/MelonPig style file reference for the skeleton JSON. e.g. premiumItems___dragonFrame___dragonFrame.json",
		},
		atlas: {
			displayName: "Atlas File",
			default: "",
			tooltip: "SAKit/MelonPig style file reference for the texture atlas. e.g. premiumItems___dragonFrame___dragonFrame.atlas",
		},
	},

	ctor() {
		this._onLoadCalled = Promise.defer();
		this._textures = [];
		this._loadingPromise = Promise.resolve();
		this._assetLoad = Promise.resolve();
	},

	onLoad() {
		this.spine = this.getComponent(sp.Skeleton);
		this._onLoadCalled.resolve();
		// If values are set in editor, setup spine view on load
		if (this.skeleton && this.atlas) {
			this.loadSpineAsset();
		}
	},

	getAssetLoadingPromise() {
		return this._assetLoad;
	},

	loadSpineAsset() {
		if (!this.skeleton || !this.atlas) {
			return Promise.reject(new Error("Tried to load spine asset without skeleton or atlas reference", TAG));
		}

		// Only load once for a given set of assets
		if (this._loadingPromise.skeleton === this.skeleton && this._loadingPromise.atlas === this.atlas) {
			return this._loadingPromise;
		} else {
			this._loadingPromise.cancel();
		}

		this.clear();

		if (this.loadingView) {
			this.loadingView.active = true;
		}
		// Duplicates the SAKit specific load flow for spine from SASpineView

		this._assetLoad = SAAssetFileManager.loadManyAssets([this.skeleton, this.atlas])
		.bind(this).then(function(results) {
			var skeletonPath = results[this.skeleton];
			var atlasPath = results[this.atlas];
			var atlasText = SAUtil.getTextFileData(atlasPath);
			this._skeletonData = this._createSkeletonData(skeletonPath, atlasPath);
			var images = atlasText.split("\n").filter(function(line) {
				return line.indexOf(".png") !== -1;
			});
			return SAAssetFileManager.loadManyAssets(images);
		})
		.then(function(assets) {
			var that = this;
			return Promise.map(Object.keys(assets), function(name) {
				return new Promise(function(resolve, reject) {
					SATextureCache.addImageAsync(assets[name], function(texture) {
						if (texture instanceof cc.Texture2D) {
							if (appPlatform === 'Web') {
								cc.loader.setAlias(name, assets[name]);
							} else {
								that._textures.push(texture);
							}
							resolve();
						} else {
							reject(new Error("Texture failed to load: " + name, TAG));
						}
					});
				});
			});
		});

		// Wait for onLoad to be called before trying to interact with the spine component
		this._loadingPromise = this._assetLoad.then(function () {
			return this._onLoadCalled.promise;
		})
		.then(function() {
			// The spine component needs to create the SGNode the same way on both platforms
			// By default, sp.Skeleton has a web specific loading flow that is incompatible
			//  with serving assets provided by SAKit. The full SAKit based loading flow above
			//  encapsulates the load for both platforms, so this should create a scene graph
			//  node the same way for both platforms
			// This instance only override removes the branching logic and an invalid safety check
			this.spine._createSgNode = function () {
				if (this.skeletonData) {
					var jsonFile = this.skeletonData.rawUrl;
					var atlasFile = this.skeletonData.atlasUrl;
					if (atlasFile) {
						if (typeof atlasFile !== 'string') {
							cc.errorID(7505);
							return null;
						}
						try {
							return new sp._SGSkeletonAnimation(jsonFile, atlasFile, this.skeletonData.scale);
						} catch (e) {
							cc._throw(e);
						}
					}
				}
				return null;
			};
			this.spine.skeletonData = this._skeletonData;
		})
		.then(this._onLoadComplete);

		// Add properties to identify that this is the loading promise for this set of spine parameters
		this._loadingPromise.skeleton = this.skeleton;
		this._loadingPromise.atlas = this.atlas;
		return this._loadingPromise;
	},

	clear() {
		// Clear out existing skeleton data
		if (this.spine) {
			this.spine.skeletonData = null;
		}
		this._loadingPromise = Promise.resolve();
		for (var i = 0; i < this._textures.length; ++i) {
			SATextureCache.releaseImage(this._textures[i]);
		}
		this._textures = [];
	},

	_createSkeletonData(skeletonPath, atlasPath) {
		const skeletonData = new sp.SkeletonData();
		skeletonData.atlasUrl = atlasPath;
		// Overwrite the rawUrl property to not be generated from UUID, but to point directly at the file path
		Object.defineProperty(skeletonData, 'rawUrl', {value: skeletonPath});
		// Exported at 4x, scale down to 2x
		skeletonData.scale = 0.5;
		return skeletonData;
	},

	_onLoadComplete() {
		if (this.loadingView) {
			this.loadingView.active = false;
		}
	},

	onDestroy() {
		for (var i = 0; i < this._textures.length; ++i) {
			SATextureCache.releaseImage(this._textures[i]);
		}

		// Revert changes in case the sp.Skeleton component will be used as a regular spine component
		if (this.spine) {
			this.spine._createSgNode = sp.Skeleton.prototype._createSgNode;
		}
	},
});
