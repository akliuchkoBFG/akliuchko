/* global
*/
const BaseDispatchAction = require('BaseDispatchAction');

// Potential here to abstract this into a more general handling of a string -> string Enum
// Key pieces are the two enums and the notify function below
const DisplayEnum = cc.Enum({
	'Profile Only': 0,
	'Avatar Picker': 1,
	'About Group': 2,
	'Social Group': 3,
	'Activity Group': 4,
	'Stats Group': 5,
	'Help Group': 6,
	'Status Module': 7,
	'Info Module': 8,
	'Title Module': 9,
});

const DeepLinkEnum = cc.Enum({
	'profile': 0,
	'profile.avatarPicker': 1,
	'profile.about': 2,
	'profile.social': 3,
	'profile.activity': 4,
	'profile.stats': 5,
	'profile.help': 6,
	'profile.about.status': 7,
	'profile.about.info': 8,
	'profile.about.title': 9,
});

cc.Class({
	extends: BaseDispatchAction,

	editor: {
		menu: 'Buttons/Open Profile',
		disallowMultiple: true,
	},

	properties: {
		_actionName:{
			default: 'openProfile',
			override: true,
			readonly: true,
		},
		// Editor only property that displays the user friendly enum
		deepLink: {
			default: DeepLinkEnum.profile,
			type: DisplayEnum,
			tooltip: 'Open a specific location within the profile',
			notify: CC_EDITOR && function() {
				// Save the string that drives the deep link action into the correct property
				this.profileDeepLink = DeepLinkEnum[this.deepLink];
			}
		},
		// Data key used in the game for launching a profile with deep link
		profileDeepLink: {
			default: DeepLinkEnum[DeepLinkEnum.profile],
			readonly: true,
			visible: false,
		},
	},

	onLoad() {
		this._super();
		this._dataPropertyKeys = ['profileDeepLink'];
	},
});
