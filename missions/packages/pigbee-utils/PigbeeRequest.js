
const request = require('request');
const Promise = require('bluebird');

// Use the sync api to load the profile with environment settings
const EnvProfile = Editor.isMainProcess
	? Editor.Profile.load("profile://local/environment-settings.json")
	: Editor.remote.Profile.load("profile://local/environment-settings.json");

const PigbeeRequest = Object.freeze({
	_requestWrappers: {},
	_getPigbeeRequest(env, app) {
		// Promisified to allow for inserting Pigbee authentication into this flow
		return new Promise((resolve, reject) => {
			const envData = EnvProfile.data.envs[env];
			if (!envData) {
				return reject(new Error("[PigbeeRequest] unknown environment: " + env));
			}
			const envID = `${envData.id}___${app}`;
			if (this._requestWrappers[envID]) {
				return resolve(this._requestWrappers[envID]);
			}
			const baseURL = envData.pigbeeURLs[app];
			if (!baseURL) {
				return reject(new Error("[PigbeeRequest] unknown baseURL for environment: " + envID));
			}

			const pigbeeRequest = request.defaults({
				baseUrl: baseURL,
				// Skip cert issues on dev environments
				// Errors there are expected because slots-admin.ffishvmpoc.qa.bigfishgames !== *.qa.bigfishgames.com
				rejectUnauthorized: env === 'live',
				// TODO: add auth cookies
			});
			this._requestWrappers[envID] = pigbeeRequest;
			resolve(this._requestWrappers[envID]);
		});
	},

	// Public interface for getting direct access to the request and corresponding APIs
	// Useful for being able to do things like request(opts).form() or request(opts).on(evtName, cb)
	getRequestModule(options, callback) {
		const {env, app} = options;
		return this._getPigbeeRequest(env, app).asCallback(callback);
	},

	getRequestOptions(options) {
		// Default to dev environment and app based on the currently selected preview client
		options.env = options.env || 'dev';
		options.app = options.app || EnvProfile.data.app;

		if (options.controller && options.action) {
			const url = this._getURLFromOptions(options);
			options.url = url;
		}
		return options;
	},

	// Convenience methods
	post(options, callback) {
		options.method = "POST";
		return this.request(options, callback);
	},
	get(options, callback) {
		options.method = "GET";
		return this.request(options, callback);
	},

	request(options, callback) {
		options = this.getRequestOptions(options);
		return this.getRequestModule(options)
		.then((pigbeeRequest) => {
			return this._makePigbeeRequest(pigbeeRequest, options);
		}).asCallback(callback);
	},

	_getURLFromOptions({controller, action, params}) {
		params = params || [];
		let url = "/" + controller + "/" + action;
		for (let i = 0; i < params.length; ++i) {
			url += "/" + encodeURIComponent(params[i]);
		}
		return url;
	},

	_makePigbeeRequest(pigbeeRequest, options) {
		return new Promise((resolve, reject) => {
			pigbeeRequest(options, (err, respObj, response) => {
				if (err) {
					// TODO catch auth errors
					return reject(err);
				}
				resolve(response);
			});
		});
	},

});

module.exports = PigbeeRequest;
