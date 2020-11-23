const _ = require('lodash');

const CLIENTS = [
	{
		id: "sakit",
		displayName: "Casino Web",
		app: 'bfc',
		baseURL: 'https://sag-web-portal.qa.bigfishgames.com/web/casino/',
	},
	{
		id: "sakit-jms",
		displayName: "JMS Web",
		app: 'jms',
		baseURL: 'https://sag-web-portal.qa.bigfishgames.com/web/jms/',
	},
	{
		id: "sakit-facebook",
		displayName: "FB Casino",
		app: 'bfc',
		baseURL: 'https://sag-web-portal.qa.bigfishgames.com/fb/stage/',
	},
];


function getClient(id) {
	const client = _.find(CLIENTS, _.matchesProperty('id', id));
	if (!client) {
		throw new Error('Unknown client: ' + id);
	}
	return client;
}

module.exports = {
	LIST: CLIENTS,
	getClient,
};
