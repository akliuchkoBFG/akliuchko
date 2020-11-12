(() => {
/* eslint-disable global-require */
const fs = require('fire-fs');
const path = require('path');
const request = require('request');
const requestProgress = require('request-progress');
const async = require('async');
const _ = require('lodash');
const AssetProcessors = Editor.require('packages://asset-import/AssetProcessors.js');
const PigbeeRequest = Editor.require('packages://pigbee-utils/PigbeeRequest.js');
/* eslint-enable global-require */

const PIGBEE_REQUEST_PARAMS = Object.freeze({
	env: 'tools',
	app: 'bfc',
	controller: 'cocos_creator',
});
const TEMP_DIR = path.join(Editor.projectInfo.path, 'assets', 'imports');

const FILES = {
	html: Editor.url('packages://asset-import/panel/asset-import.html'),
	style: Editor.url('packages://asset-import/panel/asset-import.css'),
};

const STATES = Object.freeze({
	READY: 'readyToImport',
	UPLOADING: 'uploadingToPigbee',
	DOWNLOADING: 'downloadingImports',
});

// panel/index.js, this filename needs to match the one registered in package.json
return Editor.Panel.extend({
	// css style for panel
	style: fs.readFileSync(FILES.style),

	// html template for panel
	template: fs.readFileSync(FILES.html),

	// element and variable binding
	$: {
		wrap: '#wrap',
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		this.vue = new Vue({
			el: this.$wrap,
			data: {
				downsample: true,
				lossyCompression: true,
				STATES: STATES,
				state: STATES.READY,
				uploadProgress: 0,
				files:[],
				downloads:[],
				downloadProgress: 0,
			},
			watch: {
				downloads: {
					deep: true,
					handler() {
						let progress = 0;
						if (this.downloads.length !== 0) {
							this.downloads.forEach((assetDefinition) => {
								progress += assetDefinition.progress;
							});
							progress = progress / this.downloads.length;
						}
						this.downloadProgress = progress * 100;
					},
				},
			},
			compiled() {
				this.$els.fileDrop.addEventListener('drop-area-accept', this._onDropAccept.bind(this));
			},
			methods: {
				_onDropAccept(event) {
					const files = event.detail.dragItems;
					const uploadOptions = {
						lossyCompression: this.downsample ? 1 : 0,
						shouldDownsample: this.lossyCompression ? 1 : 0,
						turboMode: 0,
						postProcessTypes: JSON.stringify(['wav', 'atlas']),
					};
					this.uploadAssets(files, uploadOptions);
				},
				uploadAssets(files, uploadProcessingOptions) {
					this.downloads = [];
					this.files = files;
					this.state = STATES.UPLOADING;
					const username = process.env.USER || process.env.USERNAME || 'unknown.user';
					const userNamespace = username.replace(/\./g, '-');
					const directoryName = 'aaaa-' + userNamespace;
					const dirPostData = {
						directoryName,
					};

					async.waterfall([
						// Delete existing directory prior to uploading new assets
						(next) => {
							this.uploadProgress = 5;
							const deleteDirOptions = Object.assign({
								action: 'deleteDirectoryByPost',
								formData: dirPostData,
							}, PIGBEE_REQUEST_PARAMS);
							PigbeeRequest.post(deleteDirOptions, next);
						},
						// Recreate the temp directory
						(response, next) => {
							this.uploadProgress = 10;
							const createDirOptions = Object.assign({
								action: 'createDirectoryByPost',
								formData: dirPostData,
							}, PIGBEE_REQUEST_PARAMS);
							PigbeeRequest.post(createDirOptions, next);
						},
						// Prepare for upload by getting PigbeeRequest pieces needed to make the request
						(response, next) => {
							let uploadOptions = Object.assign({
								action: 'uploadFileByPost',
							}, PIGBEE_REQUEST_PARAMS);
							uploadOptions = PigbeeRequest.getRequestOptions(uploadOptions);
							PigbeeRequest.getRequestModule(uploadOptions, (err, pigbeeRequest) => {
								next(err, pigbeeRequest, uploadOptions);
							});
						},
						// Upload assets
						(pigbeeRequest, uploadOptions, next) => {
							const progressStart = 15;
							// Chunk of the progress bar for the file uploads
							// The rest of the progress bar is for previous steps and server processing
							const uploadChunk = 50;
							// Fake server processing with a chunk of time incrementing off an interval
							const timeChunk = 99 - progressStart - uploadChunk;
							let intervalID;
							this.uploadProgress = progressStart;
							let totalBytes = 1e10;
							const upload = pigbeeRequest.post(uploadOptions, next);
							upload.on('response', () => {
								this.uploadProgress = 100;
								clearInterval(intervalID);
							});
							const form = upload.form();
							form.append('username', username);
							form.append('baseDirectory', directoryName);
							for (let i = 0; i < files.length; i++) {
								const filePath = files[i].path;
								form.append('asset' + i, fs.createReadStream(filePath));
							}
							_.forOwn(uploadProcessingOptions, (value, key) => {
								form.append(key, value);
							});
							let bytesUploaded = 0;
							form.getLength((err, length) => {
								if (err) return;
								totalBytes = length;
							});
							form.on('data', (chunk) => {
								bytesUploaded += chunk.length;
								const percent = Math.min(1, bytesUploaded / totalBytes);
								this.uploadProgress = progressStart + uploadChunk * percent;
							});
							form.on('end', () => {
								const timeStart = Date.now();
								// Arbitrary amount of time to fill progress while waiting for server response
								// Hopefully this is better than worst case scenario
								const PROCESSING_TIME = 30e3;
								intervalID = setInterval(() => {
									const timeElapsed = Date.now() - timeStart;
									const percent = Math.min(1, timeElapsed / PROCESSING_TIME);
									this.uploadProgress = progressStart + uploadChunk + timeChunk * percent;
								}, 100);
							});
						},
						// Download assets to temporary imports folder
						(respObj, response, next) => {
							this.state = STATES.DOWNLOADING;
							response = JSON.parse(response);
							if (response.success === false) {
								return next(new Error(response.error));
							}
							fs.ensureDirSync(TEMP_DIR);
							const assets = _.omit(response.data, ['notifications', 'errors']);
							const assetsToImport = [];

							// Iterate assets to determine which to import
							_.forOwn(assets, (asset, assetName) => {
								const assetType = asset.assetType;
								const assetDefinition = {
									assetType,
									assetName,
									progress: 0,
								};
								if (assetType === 'unknown') {
									Editor.warn('Skipping unknown asset: ' + assetName);
									return;
								} else if (assetType === 'image') {
									const imageData = asset['2x'] || asset['1x'];
									if (!imageData) {
										// Skipping 4x only images
										// This is an expected case for texture atlases that require more pngs at 4x resolution
										return;
									}
									assetDefinition.url = imageData.previewGameUrl;
									assetsToImport.push(assetDefinition);
								} else if (assetType === 'atlas') {
									assetDefinition.directoryPrefix = directoryName + '___';
									const sizeRegEx = /@(\d)x(\.[^.]+)$/;
									const result = sizeRegEx.exec(assetName);
									if (result) {
										// Extension matched @2x. or @4x.
										const size = result[1];
										// Only import 2x atlas
										if (size === "2") {
											assetDefinition.assetName = assetName.replace(result[0], result[2]);
											assetDefinition.url = asset.previewGameUrl;
											assetsToImport.push(assetDefinition);
										}
									} else {
										// 1x, or possibly non-downsampled atlas
										// Check for 2x before adding this to imports
										const s2xAssetName = assetName.replace(/\.[^.]+$/, '@2x$&');
										if (!assets[s2xAssetName]) {
											assetDefinition.url = asset.previewGameUrl;
											assetsToImport.push(assetDefinition);
										}
									}
								} else if (assetType === 'spine') {
									// Scale factor could potentially be dynamic based on input atlases
									// But generally 0.5 can be assumed correct for existing workflows
									assetDefinition.spineScale = 0.5;
									assetDefinition.url = asset.previewGameUrl;
									assetsToImport.push(assetDefinition);
								} else {
									Editor.warn(`Skipping unknown asset type ${assetType} for asset ${assetName}`);
								}
							});
							this.downloads = assetsToImport;
							async.eachOfLimit(assetsToImport, 10, (assetDefinition, index, cb) => {
								const processor = AssetProcessors.getAssetProcessor(assetDefinition);
								const filePath = path.join(TEMP_DIR, assetDefinition.assetName);
								const downloadStream = requestProgress(request.get({
									url: assetDefinition.url,
									rejectUnauthorized: false,
								}), {
									throttle: 100,
								})
								.on('progress', (state) => {
									assetsToImport[index].progress = state.percent;
								});
								// Apply conditional processing to the stream as it is being written to file
								// This allows asset processors to modify the stream without keeping the entire
								//  file in memory for minor modifications like text replacement
								processor.processDownload(downloadStream)
								.pipe(fs.createWriteStream(filePath))
								.on('close', (err) => {
									assetsToImport[index].progress = 1.0;
									if (err) {
										return cb(err);
									}
									// Apply conditional post processing to the asset
									// This is an entry point for doing things like creating a custom meta file
									processor.postProcessAsset(filePath, cb);
								});
							}, next);
						},
					],
					// onComplete
					(err) => {
						if (err) {
							Editor.error("Error while importing assets:");
							return Editor.error(err);
						}
						// Update the asset db with the newly imported assets
						Editor.assetdb.refresh('db://assets/imports', (err) => {
							this.state = STATES.READY;
							if (err) {
								Editor.error("Error while importing assets: ");
								return Editor.error(err);
							}
						});
						Editor.success('Processed assets downloaded to assets/imports');
					});
				}
			}
		});

	},

	// register your ipc messages here
	messages: {
	}
});

})();