/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Open Tournament Lobby',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'openTournamentLobby',
			override: true,
			readonly: true,
		},
	},
});
