const EditorLabelProperty = require('EditorLabelProperty');

const DESCRIPTION = `This component blocks toasts from appearing when this node activates and unblocks toasts when this node deactivates`;

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Add SAG Component/Block Toasts',
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
		this._blockToasts();
	},

	_blockToasts() {
		this._isBlocked = true;
		SAToastManager.getInstance().blockToasts();
	},

	_unblockToasts() {
		if (this._isBlocked) {
			this._isBlocked = false;
			SAToastManager.getInstance().unblockToasts();
		}
	},

	onDisable() {
		this._unblockToasts();
	},

	onDestroy() {
		this._unblockToasts();
	},
});
