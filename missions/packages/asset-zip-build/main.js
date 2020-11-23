'use strict';
const PACKAGE_NAME = 'asset-zip-build';
const PackageUtil = require('./PackageUtil.js');
const Util = new PackageUtil(PACKAGE_NAME);
const PackageAssetUtil = new PackageUtil('package-asset');
const SceneArchiveUtil = new PackageUtil('scene-archive');
const SyncPackageUtil = new PackageUtil('self-aware-sync');
const PigbeeRequest = Editor.require('packages://pigbee-utils/PigbeeRequest.js');
const EnvProfile = Editor.Profile.load('profile://local/environment-settings.json');
const fs = require('fire-fs');
const del = require('del');
const path = require('path');
const async = require('async');
const archiver = require('./lib/archiver.js');
const MAX_FILEIO_CONCURRENCY = 4;
const AssetZip = require('./AssetZip.js');
const BuildSettings = require('./BuildSettings.js');
const _ = require('lodash');
const browserify = require('browserify');
const through = require('through2');
const gulp = require('gulp');
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const {dialog} = require('electron');

class UpdateRequiredError extends Error {}

// Raw asset copy is a separate build step in app://editor/core/gulp-build.js (build-raw-assets)
// Since we can't run the individual build step with just the raw assets needed for the scene
//  the logic is roughly duplicated here
// JSON asset copies happen as part of build-assets that runs in the scene script
function copyRawAssets(uuidList, bundleName, outputDir) {
	const temp = path.join(outputDir, bundleName, 'res', 'raw-assets');
	fs.ensureDirSync(temp);
	return new Promise((resolve, reject) => {
		if (!uuidList) {
			uuidList = [];
		}
		const paths = uuidList.map((uuid) => {
			return Editor.assetdb.uuidToFspath(uuid);
		});
		const assetBasePath = path.join(Editor.projectInfo.path, 'assets');
		async.eachLimit(paths, MAX_FILEIO_CONCURRENCY, (filePath, cb) => {
			const local = path.resolve(temp, path.relative(assetBasePath, filePath));
			// Editor.log(`Copying ${path} to ${local}`);
			fs.copy(filePath, local, cb);
		}, (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}

function getImportUuidFileName(uuid, type) {
	const baseFolder = uuid.substring(0, 2);
	const baseFileName = path.join(Editor.libraryPath, 'imports', baseFolder, uuid);
	const fileName = baseFileName + "." + type;
	return fileName;
}

function getSingleJSContent(jsFiles) {
	let jsSingleContent = "({\n";
	for (let i=0; i < jsFiles.length; ++i) {

		const filePath = jsFiles[i].filePath;
		const moduleName = jsFiles[i].name;
		Editor.log("reading: " + filePath);

		const contents = fs.readFileSync(filePath);
		const header = [
			"\"" + moduleName + "\": ",
			'function(require, module, exports) {',
		].join("\n");
		const footer = [
			'},'
		].join("\n");
		jsSingleContent += [header, contents, footer].join("\n");
	}
	jsSingleContent += "\n})";

	return jsSingleContent;
}

function getSourceURLRefString(bundlePathName) {
	return "\n//# sourceURL=creator/require/"+bundlePathName+".js";
}

function appendSourceURL(bundlePathName, sourcePath) {
	const jsFilePath = path.join(sourcePath, 'bundle.js');
	const contents = fs.readFileSync(jsFilePath) + getSourceURLRefString(bundlePathName);
	fs.writeFileSync(jsFilePath, contents);
}

// this version just bundles the js... no source
function useManualCopy(bundlePathName, sourcePath, jsFiles, buildSettings) {
	const jsSingleContent = getSingleJSContent(jsFiles) + getSourceURLRefString(bundlePathName);
	const jsFilePath = path.join(sourcePath, 'bundle.js');

	return new Promise((resolve, reject) => {
		fs.writeFile(jsFilePath, jsSingleContent, (err) => {
			if (err) return reject(err);
			Editor.log("BundleJS: " + jsFilePath);
			resolve();
		});
	});
}

// use browserify to bundle the source code, replacing its "require" with a return function to use our own require/define functions in app
function useBrowserify(bundlePathName, sourcePath, jsFiles, buildSettings) {
	const sourceMaps = buildSettings.includeSource;
	const minify = buildSettings.minify;

	return new Promise((resolve, reject) => {

		try {
			const files = [];
			const modules = [];
			jsFiles.forEach((file) => {
				const filePath = file.filePath;
				const moduleName = file.name;
				const contents = fs.readFileSync(filePath);

				const fileName = moduleName + ".js";
				const tempPath = path.join(sourcePath, fileName);

				fs.writeFileSync(tempPath, contents);
				files.push(tempPath);
				modules.push(moduleName);
			});

			const b = browserify(files, {
				paths: [sourcePath],
				noParse: true,
				debug: sourceMaps,
			});

			let prefixAdded = false;
			b.pipeline.get('wrap').push(
				// this goes through each chuck of the bundle (prefix, [modules], suffix, sourcemap)
				through.obj(function (row, enc, next) {
					if (!prefixAdded) {
						// replace the prefix with a function that will return each module rather than requiring it
						this.push(
							"(function(defs, exps, reqs) {\n" +
							"// SAG - this was formally a require block that we've alterd to simply return the modules instead\n" +
							"var _modulNames = " + JSON.stringify(modules) +";" +
							"var _modules = {}; " +
							"for (var i = 0; i < reqs.length; ++i) {var name = _modulNames[i]; var key = reqs[i]; _modules[name] = defs[key][0];};" +
							// if minifying, trick it into retaining the return statement (normally dropped)
							"if (_modules) {return _modules;} else {_modules = null;}\n" + 
							"})({"
						);
						prefixAdded = true;
					} else {
						this.push(row);
					}
					next();
				})
			);

			const minifyOpts = {
				// typically, our minified "require" would return true, we don't want that since we are evaluating its return value
				compress: {negate_iife: false},
			};

			b.bundle()
			.pipe(source('bundle.js'))
			.pipe(buffer()) 							// convert from streaming to buffered vinyl file object
			.pipe(sourceMaps ? sourcemaps.init({loadMaps: true}) : gutil.noop())
			.pipe(minify ? uglify(minifyOpts) : gutil.noop())
			.pipe(sourceMaps ? sourcemaps.write() : gutil.noop())
			.pipe(gulp.dest(sourcePath))
			.on('end', function() {
				if (!sourceMaps) {
					// if we are not including the actual source maps (prod), at least append a url for some debugging capabilities
					appendSourceURL(bundlePathName, sourcePath);
				}
				// Delete temporary files
				async.each(files, (file, cb) => {
					fs.unlink(file, cb);
				}, (err) => {
					if (err) return reject(err);
					Editor.log("Bundle Success (minified: " + minify + ", source: " + sourceMaps + ")");
					resolve();
				});
			});
		} catch(e) {
			// if we encouter a failure... resort to manual copying of js
			Editor.error(e);
			Editor.warn("Browserify failed: falling back to manual copy of js files (source maps will not be available)");
			return useManualCopy(bundlePathName, sourcePath, jsFiles, buildSettings);
		}
	});
}

function bundleJS(uuidList, bundlePathName, sourcePath, buildSettings) {
	const excludeFromBundle = ['lodash', 'bluebird'];

	const jsFiles = [];
	for (let i=0; i < uuidList.length; ++i) {
		const uuid = uuidList[i];
		const info = Editor.assetdb.assetInfoByUuid(uuid);
		if (info) {
			if (info.type === 'javascript') {
				const filePath = getImportUuidFileName(uuid, "js");
				const name = info.url.replace(/^.*[\\\/]/, '').replace('.js', '');
				//Editor.log(name + " : " + filePath);
				if (excludeFromBundle.indexOf(name) < 0) {
					jsFiles.push({name: name, filePath: filePath});
				}
			}
		}
	}

	// try browserify to generate source maps
	return useBrowserify(bundlePathName, sourcePath, jsFiles, buildSettings);
}

function uploadToPigbee(manifest, buildSettings, options) {
	const env = options.dev ? 'dev' : 'live';
	const publishOptions = {
		env,
		app: 'bfc',
		controller: 'cocos_creator',
		action: 'publish',
	};

	const zipPath = path.join(buildSettings.outputDir, manifest.fileName);
	const uploadError = new Error('Pigbee upload failed!');
	const user = process.env.USER || process.env.USERNAME || 'unknown_user';
	const postData = _.assign({
		bundle: fs.createReadStream(zipPath),
		name: path.basename(manifest.fileName, '.zip'),
		system: options.system ? options.system : 'marketing_popup',
		hash: manifest.bundle,
		user,
	}, buildSettings.postData);

	if (manifest.archivePath && fs.existsSync(manifest.archivePath)) {
		postData.archive = fs.createReadStream(manifest.archivePath);
	}
	publishOptions.formData = postData;

	return PigbeeRequest.post(publishOptions)
	.then((response) => {
		let success = false;
		try {
			response = JSON.parse(response);
			success = response.success;
		} catch(e) {
			Editor.error('Failed to parse JSON server response');
		}
		if (success) {
			const data = _.pick(postData, ['hash', 'name']);
			data.url = response.url;
			// This field should only be added to publishes intended for the direct publish pipeline
			if (response.manifestExport) {
				data.export = response.manifestExport;
			}
			return data;
		} else {
			const err = uploadError;
			err.data = response;
			return Promise.reject(err);
		}
	});
}

function importManifestToQA(manifestExport) {
	const importOptions = {
		env: 'qa',
		app: 'bfc',
		controller: 'cocos_creator',
		action: 'importManifest',
		formData: {
			manifestExport: JSON.stringify(manifestExport)
		},
	};

	return PigbeeRequest.post(importOptions)
	.then((response) => {
		let success = false;
		let error = '';
		try {
			response = JSON.parse(response);
			success = response.success;
			error = response.errors && response.errors[0];
		} catch(e) {
			error = 'Failed to parse JSON server response';
		}
		if (!success) {
			Editor.error('Failed to import manifest to QA: ' + error);
		}
	})
	.catch((err) => {
		Editor.error('Failed to import manifest to QA (network error): ' + err);
	});
}

function createManifestFile(manifestData) {
	const manifestDir = path.resolve(Editor.projectInfo.path, '../manifests');
	fs.ensureDirSync(manifestDir);
	const manifestFile = path.resolve(manifestDir, manifestData.name + ".json");
	fs.writeFileSync(manifestFile, JSON.stringify(manifestData, null, '\t'));
}

function createSourceArchive(sceneUuid) {
	return SceneArchiveUtil.sendToPackage('export-scene', sceneUuid);
}

function updateIfRequired() {
	return SyncPackageUtil.sendToPackage('check-for-updates')
	.then((updateRequired) => {
		if (updateRequired.length === 0) {
			return Promise.resolve();
		} else {
			// Current version of electron only has synchronous API for dialog functions
			//  but it's named like the async API of future versions, force the sync API
			const showMessageBoxSync = dialog.showMessageBoxSync || dialog.showMessageBox;
			const dialogResponse = showMessageBoxSync({
				title: 'Update Required',
				message: 'Shared assets are out of sync and require an update before you can continue publishing',
				buttons: ['Update', 'Cancel'],
			});
			if (dialogResponse === 0) {
				return SyncPackageUtil.sendToPackage('download-shared')
				.then(() => {
					// Despite successfully completing the update, it's safer to restart the publish action
					//  since the asset library may still be updating
					const retryError = new UpdateRequiredError("Update complete, please try publishing again");
					return Promise.reject(retryError);
				});
			} else {
				const cancellationError = new Error('Publish canceled. Shared asset update required');
				return Promise.reject(cancellationError);
			}
		}
	});
}

function startBuild(event, settings, options) {
	const buildSettings = BuildSettings.getSettings(settings);
	let sceneUuid, uuidList, bundleName, scenePath, sceneName, sourcePath;
	const bundlePromises = [];
	let bundlePathName = "";
	Promise.resolve(Editor.currentSceneUuid)
	.then((uuid) => {
		sceneUuid = uuid;
		scenePath = Editor.assetdb.uuidToFspath(sceneUuid);
		if (!scenePath) {
			throw(new Error("No Preview/Upload Available: Scene must be saved"));
		}

		bundlePathName = path.relative(path.join(Editor.projectInfo.path, 'assets'), scenePath).replace('.fire', '');
		const relativePath = buildSettings.bundleNameOverride || bundlePathName;
		const escapedPathSep = path.sep.replace('\\', '\\\\');
		sceneName = bundlePathName.replace(new RegExp(escapedPathSep, 'g'), '.');
		bundleName = buildSettings.bundleNameOverride || sceneName;
		const destDir = path.join(buildSettings.outputDir, bundleName);
		sourcePath = path.join(destDir, relativePath);
		// Remove temp files
		const patterns = [path.posix.join(bundleName, '**/*'), bundleName];
		// Remove the local zip if it was uploaded
		patterns.push(bundleName + '.zip');
		del.sync(patterns, {
			cwd: buildSettings.outputDir,
		});
		fs.ensureDirSync(sourcePath);
		return PackageAssetUtil.callSceneScript('query-depend-asset', sceneUuid);
	})
	.then((list) => {
		uuidList = list;
		bundlePromises.push(Util.callSceneScript('build-assets', sceneUuid, path.join(buildSettings.outputDir, bundleName)));
		bundlePromises.push(bundleJS(uuidList, bundlePathName, sourcePath, buildSettings));
		const parameters = {
			customSettings: {
				platform: 'mac',
				groupList: ['default'],
				collisionMatrix: [true],
			},
			sceneList: [sceneUuid],
			uuidList,
			debug: true,
		};
		return new Promise((resolve, reject) => {
			Editor.require('app://editor/core/gulp-build.js').buildSettings(parameters, (err, settingsJS, rawAssets, pluginScripts) => {
				if (err) return reject(err);
				resolve({
					settingsJS,
					rawAssets,
					pluginScripts,
				});
			});
		});
	})
	.then(({settingsJS, rawAssets}) => {
		bundlePromises.push(copyRawAssets(rawAssets.assets, bundleName, buildSettings.outputDir));
		bundlePromises.push(new Promise((resolve, reject) => {
			const settingsPath = path.join(sourcePath, 'settings.js');
			fs.writeFile(settingsPath, settingsJS, (err) => {
				if (err) return reject(err);
				resolve();
			});
		}));
		return Promise.all(bundlePromises);
	})
	.then(() => {
		const zip = new AssetZip(bundleName, path.join(buildSettings.outputDir, bundleName));
		return zip.build();
	})
	.then((manifest) => {
		if (buildSettings.skipZip) {
			return manifest;
		}
		// TODO: this step should be integrated into AssetZip::build to save on file reads
		return new Promise((resolve) => {
			// Zip up bundle
			const archive = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});

			const output = fs.createWriteStream(path.join(buildSettings.outputDir, manifest.fileName));
			output.on('close', () => {
				resolve(manifest);
			});
			archive.on('warning', (err) => {
				if (err.code === 'ENOENT') {
					Editor.warn(err);
				} else {
					throw err;
				}
			});
			archive.on('error', (err) => {
				throw err;
			});
			archive.pipe(output);

			archive.glob(path.posix.join(bundleName, '**/*'), {
				cwd: buildSettings.outputDir,
				dot: false,
			});
			archive.finalize();
		});
	})
	.then((manifest) => {
		if (buildSettings.skipArchive) {
			return manifest;
		}

		return createSourceArchive(sceneUuid)
		.then((archivePath) => {
			manifest.archivePath = archivePath;
			return manifest;
		});
	})
	.then((manifest) => {
		if (buildSettings.bundleNameOverride) {
			manifest.sceneName = sceneName;
		}
		event.reply && event.reply(null, manifest);
		if (buildSettings.skipUpload || buildSettings.skipZip) {
			return;
		}
		Editor.log(`Finished building ${manifest.fileName}, uploading to Pigbee...`);
		return uploadToPigbee(manifest, buildSettings, options);
	})
	.then((manifestData) => {
		if (options.system === 'features') {
			// Features manifests get created locally and checked in to the repository
			createManifestFile(manifestData);
		} else if (manifestData && manifestData.export) {
			// Manifests should be mirrored from live to features if not already published there
			// The QA server will ignore the manifest if the same version was previously published there
			const publishedToLive = !options.dev;
			// Tools publishes create manifests on staging and should mirror to features
			const publishedToTools = options.dev && EnvProfile.data.envs.dev.id === 'tools';
			if (publishedToLive || publishedToTools) {
				importManifestToQA(manifestData.export);
			}
		}
	})
	.then(() => {
		Editor.success("Build complete!");
	})
	.catch((e) => {
		Editor.error(e);
		event.reply && event.reply(e);
	})
	.then(() => {
		if (!buildSettings.cleanup) {
			return;
		}
		// Remove temp files
		const patterns = [path.posix.join(bundleName, '**/*'), bundleName];
		// Remove the local zip if it was uploaded
		if (!buildSettings.skipUpload) {
			patterns.push(bundleName + '.zip');
		}
		del(patterns, {
			cwd: buildSettings.outputDir,
		});
	})
	.catch(Editor.error);
}

module.exports = {
	load () {
		// When the package loaded
	},

	unload () {
		// When the package unloaded
		Object.keys(require.cache).filter((filePath) => {return filePath.includes(PACKAGE_NAME);})
		.forEach((key) => {
			delete require.cache[key];
		});
	},

	messages: {
		'start-build' (event, settings) {
			startBuild(event, settings, {system: 'marketing_popup', dev: true});
		},
		'start-build-marketing-prod' (event, settings) {
			updateIfRequired()
			.then(() => {
				startBuild(event, settings, {system: 'marketing_popup', dev: false});
			})
			.catch((err) => {
				if (event.reply) {
					event.reply(err);
				} else if (err instanceof UpdateRequiredError) {
					Editor.warn(err.message);
				} else {
					Editor.error("Build failed\n" + err.message);
				}
			});
		},
		'start-build-marketing-dev' (event, settings) {
			updateIfRequired()
			.then(() => {
				startBuild(event, settings, {system: 'marketing_popup', dev: true});
			})
			.catch((err) => {
				if (event.reply) {
					event.reply(err);
				} else if (err instanceof UpdateRequiredError) {
					Editor.warn(err.message);
				} else {
					Editor.error("Build failed\n" + err.message);
				}
			});
		},
		'start-build-features-dev' (event, settings) {
			// Force skip source archiving for features, these are built from files in version control
			settings = settings || {};
			settings.skipArchive = true;
			startBuild(event, settings, {system: 'features', dev: true});
		},
		'open-settings-panel'() {
			Editor.Panel.open('asset-zip-build');
		},
		// Remove all temp directory contents
		// This option is useful for clearing out build files
		'delete-temp-directory'() {
			// Ask for confirmation first
			// Current version of electron only has synchronous API for dialog functions
			//  but it's named like the async API of future versions, force the sync API
			const showMessageBoxSync = dialog.showMessageBoxSync || dialog.showMessageBox;
			const dialogResponse = showMessageBoxSync({
				title: 'Are you sure?',
				message: 'Are you sure? Deleting temporary files is usually safe, but not reversible.',
				buttons: ['Delete', 'Cancel'],
			});
			if (dialogResponse === 0) {
				const tempDir = path.join(Editor.projectInfo.path, 'temp');
				del(['**/*'], {
					cwd: tempDir,
				}, (err) => {
					if (err) {
						return Editor.error("Unable to remove some temp files, try restarting Cocos Creator\n" + err);
					}
					Editor.QuickCompiler.compileAndReload();
					Editor.success("Temp files cleared, you will need to build again before you can use the previewer");
				});
			}
		},
	},
};