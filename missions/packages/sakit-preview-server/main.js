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
const {dialog} = require('electron');

const ipcListener = new Editor.IpcListener();

const PREVIEW_PORT = 3457;
const PREVIEW_PORT_HTTPS = 3458;
const PREVIEW_DIR = path.join(Editor.projectInfo.path, 'temp', 'sakit-preview');
const BUILD_DEBOUNCE_WAIT = 5e3;

const EnvProfile = Editor.Profile.load("profile://local/environment-settings.json");

let lastBuiltManifest = null;
let previewInGame = false;

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
		.then((manifest) => {
			lastBuiltManifest = manifest;
		})
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

function getPreviewURL(previewScene) {
	const env = EnvProfile.data.envs.dev;
	const baseURL = EnvProfile.data.previewURL;
	const previewServer = env.serverURL.replace('https://', '');
	const urlParts = [
		baseURL,
		'?kServerURL=', previewServer,
		'&kAssetServerURL=', previewServer,
		'&kServerProtocol=https',
	];
	if (previewScene) {
		urlParts.push('&debugTestView=1');
		urlParts.push(`&debugTestViewName=${previewScene}`);
	}
	return urlParts.join('');
}

function launchPreviewScene() {
	const previewUrl = getPreviewURL('server:creatorPreview');
	if (previewUrl) {
		electron.shell.openExternal(previewUrl);
	}
}

function launchGameScene() {
	const previewUrl = getPreviewURL();
	if (previewUrl) {
		electron.shell.openExternal(previewUrl);
	}
}

function updateAssetWatcher() {
	try {
		const buildOnSave = EnvProfile.data.previewBuildOnSave;
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

function onQuit() {
	// Warn if preview is still serving in game
	if (previewInGame) {
		// Current version of electron only has synchronous API for dialog functions
		//  but it's named like the async API of future versions, force the sync API
		const showMessageBoxSync = dialog.showMessageBoxSync || dialog.showMessageBox;
		showMessageBoxSync({
			type: 'warning',
			message: "In game preview is still enabled, don't forget to publish!",
		});
	}
}

function onEnvProfileChanged() {
	// Notify scene script of change so updates to the client can trigger changes on the platform controls
	Editor.Scene.callSceneScript('sakit-preview-server', 'env-profile-changed');
}

module.exports = {
	load () {
		PreviewLoadData.listenForMessages(ipcListener);
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
		app.get('/getPreviewScene', (req, res) => {
			res.set('Cache-Control', 'no-store');
			const response = {};
			response.gamePreviewEnabled = previewInGame;
			if (lastBuiltManifest) {
				response.name = lastBuiltManifest.sceneName;
				response.hash = lastBuiltManifest.bundle;
			}
			res.send(response);
		});
		app.get('/', function (req, res) {
			res.sendFile(path.join(PREVIEW_DIR, 'preview.zip'));
		});
		server = app.listen(PREVIEW_PORT, () => console.log('Preview server listening on port ' + PREVIEW_PORT));
		// cert.pem is copied from tools/docker/casino/lighttpd/conf
		// See https://bigfishgames.atlassian.net/wiki/spaces/sageng/pages/753729541/Updating+Docker+SSL+Certs
		const credentials = fs.readFileSync(Editor.url('packages://sakit-preview-server/cert.pem', 'utf8'));
		serverHttps = https.createServer({
			key: credentials,
			cert: credentials,
		}, app).listen(PREVIEW_PORT_HTTPS);

		// Automatic preview builds
		updateAssetWatcher();

		// Launch preview scene when play button is selected with 'sakit' as the platform
		ipcMain.on('app:play-on-device', launchPreviewScene);

		Editor.App.on('quit', onQuit);
		EnvProfile.addListener('changed', onEnvProfileChanged);
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
		Editor.App.off('quit', onQuit);
		EnvProfile.removeListener('changed', onEnvProfileChanged);
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
		'change-preview-in-game'(evt, shouldPreview) {
			previewInGame = shouldPreview;
		},
	},
};