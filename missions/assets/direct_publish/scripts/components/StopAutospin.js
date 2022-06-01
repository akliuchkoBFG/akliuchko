const EditorLabelProperty = require('EditorLabelProperty');

const DESCRIPTION = `This component stops the current slot from auto-spinning as soon as it is enabled.`;

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Miscellaneous/Stop Autospin',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		editorDescription: {
			get() {
				if (!this._editorDescription) {
					this._editorDescription = new EditorLabelProperty(DESCRIPTION);
				}
				return this._editorDescription;
			},
			type: EditorLabelProperty,
		},
	},

	onEnable() {
		SANotificationCenter.getInstance().postNotification('slots.autoSpin.stop');
	},
});
