'use strict';
const PACKAGE_NAME = 'sakit-preview-server';
const PackageUtil = require(Editor.url('packages://asset-zip-build/PackageUtil.js'));
const AssetWatcher = require('./AssetWatcher.js');
const PreviewLoadData = require('./PreviewLoadData.js');
const PreviewCharacters = require('./PreviewCharacters.js');

const express = require('express');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const https = require('https');
let app, server, serverHttps, watcher;
const electron = require('electron');
const ipcMain = electron.ipcMain;
const bodyParser = require('./lib/body-parser.js');

const ipcListener = new Editor.IpcListener();

const PREVIEW_PORT = 3457;
const PREVIEW_PORT_HTTPS = 3458;
const PREVIEW_DIR = path.join(Editor.projectInfo.path, 'temp', 'sakit-preview');
const BUILD_DEBOUNCE_WAIT = 5e3;

const SAVED_SETTINGS_PATH = Editor.url("profile://local/asset-zip-build-settings.json");

const PLATFORM_BASE_URLS = {
	'sakit': 'https://sag-web-portal.qa.bigfishgames.com/web/casino/',
	'sakit-jms': 'https://sag-web-portal.qa.bigfishgames.com/web/jms/',
	'sakit-facebook': 'https://sag-web-portal.qa.bigfishgames.com/fb/stage/',
};

const startPreviewBuildImmediate = () => {
	Editor.log("Start preview build");
	try {
		const AssetZipBuildUtil = new PackageUtil('asset-zip-build');
		const buildSettings = {
			outputDir: PREVIEW_DIR,
			skipZip: false,
			skipUpload: true,
			skipArchive: true,
			cleanup: false,
			bundleNameOverride: 'preview',
			includeSource: true,
			minify: false,
		};
		AssetZipBuildUtil.sendToPackage('start-build', buildSettings)
		.catch(Editor.error);
	} catch(e) {
		Editor.error(e);
	}
};

const startPreviewBuild = _.debounce(
startPreviewBuildImmediate,
BUILD_DEBOUNCE_WAIT,
{
	leading: false,
	trailing: true,
});

function getPreviewServerFromBuildSettings() {
	let prevEnv = 'casino-tools.qa';
	try {
		prevEnv = JSON.parse(fs.readFileSync(SAVED_SETTINGS_PATH)).previewEnv || prevEnv;
	} catch (e) {
		// No settings file found
	}
	return prevEnv + '.bigfishgames.com';
}

function getPreviewURLFromBuildSettings(platform, previewScene) {
	const previewServer = getPreviewServerFromBuildSettings();
	const baseURL = PLATFORM_BASE_URLS[platform];
	if (!baseURL) {
		Editor.warn("Unsupported preview platform: " + platform);
		return;
	}
	let debugTestView = '';
	if (previewScene) {
		debugTestView = `debugTestView=1&debugTestViewName=${previewScene}&`;
	}
	const url = baseURL
		+ `?kServerURL=${previewServer}&kAssetServerURL=${previewServer}&kServerProtocol=https&`
		+ debugTestView;
	return url;
}

function launchPreviewScene() {
	const previewUrl = getPreviewURLFromBuildSettings(
		Editor.App._profile.data['preview-platform'],
		'server:creatorPreview'
	);
	if (previewUrl) {
		electron.shell.openExternal(previewUrl);
	}
}

function launchGameScene() {
	const previewUrl = getPreviewURLFromBuildSettings(
		Editor.App._profile.data['preview-platform']
	);
	if (previewUrl) {
		electron.shell.openExternal(previewUrl);
	}
}

function updateAssetWatcher() {
	try {
		const buildOnSave = JSON.parse(fs.readFileSync(SAVED_SETTINGS_PATH))["preview-build-on-save"];
		if (buildOnSave) {
			watcher = new AssetWatcher();
			watcher.listen(startPreviewBuild);
		} else {
			watcher && watcher.cleanup();
			watcher = null;
		}
	} catch (e) {
		// No settings file found
	}
}

module.exports = {
	load () {
		PreviewLoadData.listenForMessages(ipcListener);
		PreviewCharacters.listenAndInitialize(
			ipcListener,
			Editor.App._profile.data['preview-platform'],
			getPreviewServerFromBuildSettings()
		);
		// Preview server
		app = express();
		app.disable('view cache');
		app.use(function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		});
		app.use(bodyParser.json({
			type: [
				'application/json',
				'application/x-www-form-urlencoded',
			],
		}));
		app.use(express.static(PREVIEW_DIR));
		app.get('/hash', function (req, res) {
			const json = fs.readFileSync(path.join(PREVIEW_DIR, 'preview', 'preview.manifest'));
			const manifest = JSON.parse(json);
			const hash = manifest.bundle;
			res.send({
				success: true,
				hash: hash,
			});
		});
		app.get('/getLoadData', (req, res) => {
			res.set('Cache-Control', 'no-store');
			res.send(PreviewLoadData.get());
		});
		app.post('/setPreviewEnv', (req, res) => {
			const serverURL = req.param('serverURL');
			const characterID = req.param('characterID');
			const handle = req.param('handle');
			PreviewCharacters.updatePreviewCharacter(serverURL, {characterID, handle});
			res.send({
				success: true,
			});
		});
		app.get('/', function (req, res) {
			res.sendFile(path.join(PREVIEW_DIR, 'preview.zip'));
		});
		server = app.listen(PREVIEW_PORT, () => console.log('Preview server listening on port ' + PREVIEW_PORT));
		serverHttps = https.createServer({
			key: fs.readFileSync(Editor.url('packages://sakit-preview-server/key.pem', 'utf8')), 
			cert: fs.readFileSync(Editor.url('packages://sakit-preview-server/cert.pem', 'utf8')),
		}, app).listen(PREVIEW_PORT_HTTPS);

		// Automatic preview builds
		updateAssetWatcher();

		// Launch preview scene when play button is selected with 'sakit' as the platform
		ipcMain.on('app:play-on-device', launchPreviewScene);
	},

	unload () {
		ipcListener.clear();
		// execute when package unloaded
		server && server.close();
		serverHttps && serverHttps.close();
		watcher && watcher.cleanup();
		startPreviewBuild.cancel();

		// When the package unloaded
		Object.keys(require.cache).filter((filePath) => {return filePath.includes(PACKAGE_NAME);})
		.forEach((key) => {
			delete require.cache[key];
		});
		ipcMain.removeListener('app:play-on-device', launchPreviewScene);
	},

	// register your ipc messages here
	messages: {
		'change-build-on-save'() {
			updateAssetWatcher();
		},
		'build-for-preview'() {
			startPreviewBuild.cancel();
			startPreviewBuildImmediate();
		},
		'get-preview-launch-data'() {
			Editor.log("Add the following line to your scratchpad to launch the current preview scene as a popup:");
			Editor.log(`Creator.pushPreviewPopup(null, ${PREVIEW_PORT_HTTPS});`);
		},
		'launch-game-scene'() {
			Editor.success("Launching the game connected to the current preview environment.");
			Editor.success("This can be useful for finding out your characterID in the preview scene");
			Editor.warn("You will not be able to see changes made to the current scene in the game");
			setTimeout(launchGameScene, 5e3);
		},
		'launch-preview-scene'() {
			launchPreviewScene();
		},
		'get-current-characterID'(evt) {
			const characters = PreviewCharacters.getForCurrentEnvironment();
			let characterID = '0';
			if (characters.length > 0) {
				characterID = characters[0].characterID;
			}
			evt.reply && evt.reply(null, characterID);
		},
		'get-characters-for-environment'(evt) {
			const characters = PreviewCharacters.getForCurrentEnvironment();
			evt.reply && evt.reply(null, characters);
		},
	},
};