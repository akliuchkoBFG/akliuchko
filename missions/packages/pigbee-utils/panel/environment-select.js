(() => {

/* eslint-disable global-require */
const _ = require('lodash');
const fs = require('fire-fs');
const Environments = Editor.require('packages://pigbee-utils/Environments.js');
const Clients = Editor.require('packages://pigbee-utils/Clients.js');
const {shell:{openExternal}} = require('electron');
/* eslint-enable global-require */

const PROFILE = "profile://local/environment-settings.json";
const RAW_SETTINGS_KEYS = ['serverID', 'clientID', 'vmID'];
const ENVIRONMENTS_LIST = _.cloneDeep(_.filter(Environments.LIST, (env) => { return env.id !== 'live'; }));
const CLIENTS_LIST = _.cloneDeep(Clients.LIST);
const FILES = {
	html: Editor.url('packages://pigbee-utils/panel/environment-select.html'),
	style: Editor.url('packages://pigbee-utils/panel/environment-select.css'),
};

return Editor.Panel.extend({
	style: fs.readFileSync(FILES.style),
	template: fs.readFileSync(FILES.html),

	$: {
		wrap: '#wrap',
	},

	ready () {
		this.vue = new Vue({
			el: this.$wrap,
			data: {
				previewClients: CLIENTS_LIST,
				previewEnvironments: ENVIRONMENTS_LIST,
				serverID: 'tools',
				clientID: 'sakit',
				vmID: '',
			},
			compiled() {
				// Load existing profile
				Editor.Profile.load(PROFILE, (err, profile) => {
					if (err) {
						Editor.error(err);
						return;
					}
					this.profile = profile;
					// Trigger an initialization update
					this._onProfileChanged();
				});
			},
			methods: {
				launchGame() {
					const env = Environments.getEnvironment(this.serverID, this.vmID);
					const client = Clients.getClient(this.clientID);
					const previewServer = env.serverURL.replace('https://', '');
					const previewURL = [
						client.baseURL,
						'?kServerURL=', previewServer,
						'&kAssetServerURL=', previewServer,
						'&kServerProtocol=https',
					].join('');
					openExternal(previewURL);
				},
				launchPigbee() {
					const env = Environments.getEnvironment(this.serverID, this.vmID);
					const app = Clients.getClient(this.clientID).app;
					const pigbeeURL = env.pigbeeURLs[app];
					openExternal(pigbeeURL);
				},
				saveSettings() {
					if (!this.profile) {
						Editor.error("Unable to save environment settings");
						return;
					}
					RAW_SETTINGS_KEYS.forEach((setting) => {
						this.profile.data[setting] = this[setting];
					});
					this.profile.data.envs.dev = Environments.getEnvironment(this.serverID, this.vmID);
					this.profile.save();
				},
				_onProfileChanged() {
					const settings = this.profile.data;
					RAW_SETTINGS_KEYS.forEach((setting) => {
						this[setting] = settings[setting];
					});
				},
			},
		});
	},

	messages: {
	}
});
})();
