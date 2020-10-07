/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

// Potential here to abstract this into a more general handling of a string -> string Enum
// Key pieces are the two enums and the notify function below
const GameType = cc.Enum({
	'All': 0,
	'Slots': 1,
	'Vip': 2,
	'High Roller': 3,
	'Classic Slots': 4,
});

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Add Button Action/Exit To Lobby',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'exitSAKit',
			override: true,
			readonly: true,
		},
		// Editor only property that displays the user friendly enum
		sublobby: {
			default: GameType.All,
			type: GameType,
			tooltip: 'Go to a specific sublobby',
			notify: CC_EDITOR && function() {
				// Save the string that drives the deep link action into the correct property
				this.gameType = GameType[this.sublobby];
			}
		},
		// Data key used in the game for launching a profile with deep link
		gameType: {
			default: GameType[GameType.All],
			readonly: true,
			// visible: false,
		},
	},

	onLoad() {
		this._super();
		this._dataPropertyKeys = ['gameType'];
	},

	// Data object doesn't conform to standards, it's simpler to override the performAction
	performAction() {
		SADispatchObject.performAction(this._actionName, {data:{gameType:this.gameType}, cleanup:true});
	},
});
