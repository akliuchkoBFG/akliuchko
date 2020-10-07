/*
When using this property it should be set to not serialize
It will initialize preview characterID to the last used character for the current developer and environment

Example property definition:
{
	default: function() {
		return new PreviewCharacterProperty();
	},
	serializable: false,
	type: PreviewCharacterProperty,
	editorOnly: true,
}
*/

const PreviewCharacterProperty = cc.Class({
	name: 'PreviewCharacterProperty',
	statics: {
		recentCharacterID: null,
	},
	properties: {
		characterID: {
			default: '0',
		},
	},
	ctor() {
		if (!CC_EDITOR) {
			return;
		}
		// Use static cache if available
		if (PreviewCharacterProperty.recentCharacterID !== null) {
			this.characterID = PreviewCharacterProperty.recentCharacterID;
			return;
		}
		Editor.Ipc.sendToMain('sakit-preview-server:get-current-characterID', (err, characterID) => {
			if (err) {
				Editor.error("Failed to retrieve preview character, setting to none\n" + err);
				PreviewCharacterProperty.recentCharacterID = '0';
				return;
			}
			PreviewCharacterProperty.recentCharacterID = characterID;
			this.characterID = characterID;
		});
	},
});

module.exports = PreviewCharacterProperty;
