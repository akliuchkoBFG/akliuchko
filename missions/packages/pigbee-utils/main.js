'use strict';

const Environments = require('./Environments.js');
const Clients = require('./Clients.js');
const _ = require('lodash');
const fs = require('fire-fs');

const PROFILE = "profile://local/environment-settings.json";
const DEFAULT_CLIENT = Clients.getClient('sakit');
const DEFAULT_PROFILE = Object.freeze({
	serverID: 'tools',
	clientID: DEFAULT_CLIENT.id,
	app: DEFAULT_CLIENT.app,
	previewURL: DEFAULT_CLIENT.baseURL,
	previewBuildOnSave: false,
	vmID: '',
	envs: {
		// Development environment
		// This can be changed through tooling and is the primary environment used in Cocos Creator
		// Tools is the default dev environment
		dev: Environments.getEnvironment('tools', ''),
		// Static environments
		// The following should not be editable by tooling, but can be hand edited by deveolpers
		//  looking to test flows that usually would force a specific environment
		qa: Environments.getEnvironment('default', ''),
		tools: Environments.getEnvironment('tools', ''),
		live: Environments.getEnvironment('live', ''),
	},
});

let profile = null;

// Multiple places change clientID, make sure app and previewURL update to reflect the client choice
function onEnvironmentChange() {
	if (!profile) return;
	const {clientID} = profile.data;
	const client = Clients.getClient(clientID);
	profile.data.app = client.app;
	profile.data.previewURL = client.baseURL;
	profile.removeListener('changed', onEnvironmentChange);
	profile.save();
	profile.addListener('changed', onEnvironmentChange);
}

module.exports = {
	load() {
		// Load environment settings profile to initialize with defaults
		profile = Editor.Profile.load(PROFILE);
		let profileDirty = false;
		if (!profile.data.serverID) {
			// Initialize with default settings
			_.forOwn(DEFAULT_PROFILE, (setting, key) => {
				profile.data[key] = setting;
			});
			// Look in build settings to roll forward the pigbeeEnv setting to the environment profile
			try {
				const buildSettingsURL = Editor.url("profile://local/asset-zip-build-settings.json");
				const buildSettings = JSON.parse(fs.readFileSync(buildSettingsURL));
				if (buildSettings.pigbeeEnv && buildSettings.pigbeeEnv !== 'casino-tools') {
					Editor.log("Rolling forward build settings to env profile for env: " + buildSettings.pigbeeEnv);
					profile.data.envs.dev = Environments.getEnvironment('localvm', buildSettings.pigbeeEnv);
					profile.data.localvm = buildSettings.pigbeeEnv;
					profile.save();
				}
				// Remove deprecated build settings
				delete buildSettings.pigbeeEnv;
				delete buildSettings.previewEnv;
				delete buildSettings.syncURL;
				delete buildSettings['preview-build-on-save'];
				fs.writeFileSync(buildSettingsURL, JSON.stringify(buildSettings, null, 2));
			} catch (e) {
				// Intentionally empty
			}
			profileDirty = true;
		} else {
			// Check existing envs data to make sure all static environments are available
			_.forOwn(DEFAULT_PROFILE.envs, (env, type) => {
				if (!profile.data.envs[type]) {
					profile.data.envs[type] = env;
					profileDirty = true;
				}
			});
		}
		if (profileDirty) {
			profile.save();
		}
		profile.addListener('changed', onEnvironmentChange);
	},
	unload() {
		if (profile) {
			profile.removeListener('changed', onEnvironmentChange);
			profile = null;
		}
	},
	messages: {
		open() {
			Editor.Panel.open('pigbee-utils');
		},
	},
};
