const fs = require('fs');
const url = require('url');
const _ = require('lodash');

const SAVED_CHARACTER_DATA = Editor.url("profile://local/preview-characters.json");
// Map of environment to array of {characterID, handle} ordered by most recently used
let charactersCached = null;
// Profile for current environment parameters
const EnvProfile = Editor.Profile.load("profile://local/environment-settings.json");

const PreviewCharacters = {
	_loadFromFile() {
		let characters = {};
		try {
			characters = JSON.parse(fs.readFileSync(SAVED_CHARACTER_DATA));
		} catch (e) {
			// No characters file found
		}
		return characters;
	},
	_getEnvId(host, app) {
		return `${host}___${app}`;
	},
	_getEnvironmentFromURL(serverURL) {
		serverURL = url.parse(serverURL);
		// Environment is a combination of host and app
		const pathParts = serverURL.path.split('/')
			.filter((part) => {
				return part !== '';
			});
		const app = (pathParts[0] === 'slotzilla') ? 'jms' : 'bfc';
		const env = this._getEnvId(serverURL.host, app);
		return env;
	},
	updatePreviewCharacter(serverURL, characterData) {
		const env = this._getEnvironmentFromURL(serverURL);
		const characters = this.getAll();
		let existingCharacters = characters[env];
		if (!existingCharacters) {
			existingCharacters = [];
		}
		existingCharacters.unshift(characterData);
		const uniqueCharacters = _.uniqBy(existingCharacters, 'characterID');
		this._saveCharactersListToCache(env, uniqueCharacters);
		this._saveCacheToFile();
	},
	_saveCharactersListToCache(env, charactersList) {
		charactersCached[env] = charactersList;
	},
	_saveCacheToFile() {
		if (!charactersCached) {
			Editor.error("Unable to save preview characters list before loading");
			return;
		}
		fs.writeFileSync(SAVED_CHARACTER_DATA, JSON.stringify(charactersCached, null, 2));
	},
	getAll() {
		if (!charactersCached) {
			charactersCached = this._loadFromFile();
		}
		return charactersCached;
	},
	_getCurrentEnvironment() {
		const app = EnvProfile.data.app;
		const serverURL = url.parse(EnvProfile.data.envs.dev.serverURL);
		return this._getEnvId(serverURL.host, app);
	},
	getForCurrentEnvironment() {
		const env = this._getCurrentEnvironment();
		const characters = this.getAll();
		return characters[env] || [];
	},
};

module.exports = PreviewCharacters;