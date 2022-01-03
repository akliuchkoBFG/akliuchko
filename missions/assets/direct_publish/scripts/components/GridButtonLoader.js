
const SAImage = require('SAImage');

const TAG = "GridButtonLoader";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: SAImage,
	},

	loadGridButton: function(gridButtonData) {
		const saImage = this.getComponent('SAImage');
		if (!gridButtonData.buttonBundle || !gridButtonData.buttonImage) {
			this.log.e("Grid Button data incomplete or invalid\n" + JSON.stringify(gridButtonData));
			return Promise.reject();
		}
		const imageInfo = gridButtonData.buttonBundle;
		if (!imageInfo || !imageInfo.urls) {
			this.log.e("Grid Button data incomplete or invalid\n" + JSON.stringify(gridButtonData));
			return Promise.reject();
		}
		const url = imageInfo.urls[Game.getAssetScale().size];
		const loadingPromise = SAAssetZipManager.getInstance().updateCloudZip(imageInfo.name, imageInfo.hash, url, false)
		.then(() => {
			saImage.imageName = gridButtonData.buttonImage;
			return saImage.loadImageAsset();
		});
		loadingPromise.catch((error) => {
			this.log.e("Unable to load grid button image " + error);
		});

		return loadingPromise;
	},
});
