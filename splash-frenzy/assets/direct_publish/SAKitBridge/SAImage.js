const TAG = 'SAImageComponent';

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		requireComponent: cc.Sprite,
	},

	properties: {
		loadingView: {
			default: null,
			type: cc.Node,
			tooltip: "(Optional) Node to show while image view is in the process of loading",
		},
		imageName: {
			default: "",
			tooltip: "SAKit/MelonPig style file reference for the image name. e.g. sparkle-gridButtons___badges___lock-icon.png",
		},
	},

	ctor() {
		this._onLoadCalled = Promise.defer();
		this._loadingPromise = Promise.resolve();
		this._assetLoad = Promise.resolve();
	},

	onLoad: function () {
		this.sprite = this.getComponent(cc.Sprite);
		this._onLoadCalled.resolve();

		// If value is set in editor, setup image view on load
		if (this.imageName) {
			this.loadImageAsset();
		}
	},

	getAssetLoadingPromise() {
		return this._assetLoad;
	},

	loadImageAsset() {
		if (!this.imageName) {
			return Promise.reject(new Error("Tried to load image asset without an image name", TAG));
		}

		// Only load once for a given imageName
		if (this._loadingPromise.imageName === this.imageName) {
			return this._loadingPromise;
		}

		this.clear();

		if (this.loadingView) {
			this.loadingView.active = true;
		}

		// Duplicates the SAKit specific load flow for images from SAImageView
		this._assetLoad = SAAssetFileManager.loadSingleAsset(this.imageName)
		.bind(this)
		.then(function(path) {
			return new Promise(function(resolve, reject) {
				SATextureCache.addImageAsync(path, function(texture) {
					texture instanceof cc.Texture2D ? resolve(texture) : reject(new Error("Texture failed to load."));
				});
			});
		});
		this._loadingPromise = this._assetLoad
		// Wait for onLoad to be called before trying to interact with the image component
		.tap(function () {
			return this._onLoadCalled.promise;
		})
		.then(function(texture) {
			this._releaseTexture();
			this._texture = texture;
			const mult = Game.getAssetScale().mult;
			const spriteFrame = new cc.SpriteFrame(texture);
			this.sprite.spriteFrame = spriteFrame;
			this.node.setContentSize(cc.size(texture.width * mult, texture.height * mult));
		})
		.then(this._onLoadComplete);

		// Add properties to identify that this is the loading promise for this set of image parameters
		this._loadingPromise.imageName = this.imageName;
		return this._loadingPromise;
	},

	clear() {
		// Clear out existing image
		if (this.sprite) {
			this.sprite.spriteFrame = null;
		}
		this._releaseTexture();
		this._loadingPromise.cancel();
		this._loadingPromise = Promise.resolve();
	},

	_onLoadComplete() {
		if (this.loadingView) {
			this.loadingView.active = false;
		}
	},

	_releaseTexture() {
		if (this._texture) {
			SATextureCache.releaseImage(this._texture);
			this._texture = null;
		}
	},

	onDestroy() {
		this._loadingPromise.cancel();
		this._releaseTexture();
	},
});
