/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Open Reel Rivals Lobby',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'openBuyInTournamentLobby',
			override: true,
			readonly: true,
		},
	},
});
