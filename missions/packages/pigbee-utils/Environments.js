const _ = require('lodash');

const ENVIRONMENTS = [
	{
		id: "localvm",
		displayName: "Local VM",
		// This entry is always a dynamic environment that populates from the dev template
	},
	{
		id: "tools",
		displayName: "Tools",
		serverURL: "https://casino-tools.qa.bigfishgames.com/",
		pigbeeURLs: {
			bfc: "https://casino-tools.qa.bigfishgames.com:8080/",
			jms: "https://slots-admin.casino-tools.qa.bigfishgames.com:8080/",
		},
	},
	{
		id: "default",
		displayName: "Default",
		serverURL: "https://casino.qa.bigfishgames.com/",
		pigbeeURLs: {
			bfc: "https://casino-admin.qa.bigfishgames.com/",
			jms: "https://slots-admin.qa.bigfishgames.com/",
		},
	},
	{
		id: "staging",
		displayName: "Staging",
		serverURL: "https://casino-stage.bigfishgames.com/",
		pigbeeURLs: {
			bfc: "https://casino-admin.st.bigfishgames.com/",
			jms: "https://slots-admin.st.bigfishgames.com/",
		},
	},
	{
		id: "live",
		displayName: "Live",
		serverURL: "https://casino.bigfishgames.com/",
		pigbeeURLs: {
			bfc: "https://casino-admin.sea.bigfishgames.com/",
			jms: "https://slots-admin.sea.bigfishgames.com/",
		},
	},
];

const DEV_ENVIRONMENT_TEMPLATE = {
	serverURL: "https://%s.qa.bigfishgames.com/",
	pigbeeURLs: {
		bfc: "https://%s.qa.bigfishgames.com:8080/",
		jms: "https://slots-admin.%s.qa.bigfishgames.com:8080/",
	},
};

const FEATURES_ENVS = [
	'casino-features01',
	'casino-features02',
	'casino-features03',
	'casino-features04',
	'casino-features05',
	'casino-features06',
	'casino-features07',
	'casino-features08',
	'casino-features09',
	'casino-features10',
	'casino-features11',
	'casino-features12',
	'casino-features13',
	'casino-features14',
	'casino-features15',
	'casino-features16',
	'casino-features17',
	'casino-features18',
	'casino-features19',
	'casino-features20',
	'casino-features21',
	'casino-features52',
	'casino-features53',
	'casino-features54',
	'casino-features55',
	'casino-features56',
	'casino-features57',
	'casino-features58',
	'casino-features59',
];

function makeDevEnvironment(devID, displayName) {
	const env = _.cloneDeep(DEV_ENVIRONMENT_TEMPLATE);
	env.serverURL = env.serverURL.replace('%s', devID);
	env.pigbeeURLs.bfc = env.pigbeeURLs.bfc.replace('%s', devID);
	env.pigbeeURLs.jms = env.pigbeeURLs.jms.replace('%s', devID);
	env.id = devID;
	env.displayName = displayName;
	return env;
}

for (const featuresEnv of FEATURES_ENVS) {
	const displayName = featuresEnv.replace("casino-f", "F");
	const env = makeDevEnvironment(featuresEnv, displayName);
	ENVIRONMENTS.push(env);
}

function getEnvironment(id, inputData) {
	let env = _.find(ENVIRONMENTS, _.matchesProperty('id', id));
	if (!env) {
		throw new Error('Unknown environment: ' + id);
	}
	if (id === 'localvm') {
		if (inputData == null) {
			throw new Error('Unknown local vm');
		}
		env = _.assign({}, env, makeDevEnvironment(inputData, "Local VM"));
	}
	return env;
}

module.exports = {
	LIST: ENVIRONMENTS,
	makeDevEnvironment,
	getEnvironment,
};
