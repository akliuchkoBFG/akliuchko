// Base class for a reskinnable element
cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		executeInEditMode: true,
	},

	properties: {
		isReskinned: {
			// Reskin components will get reset when copying a scene template
			default: true,
			readonly: true,
			tooltip: "Has this element been reskinned for this scene",
		},
	},

	onLoad() {
		this._objFlags |= cc.Object.Flags.EditorOnly;
		this._ipc = new Editor.IpcListener();
		this._ipc.on('scene-save-as:scene-copied', this.onCopyScene.bind(this));
	},

	onCopyScene() {
		this.isReskinned = false;
		// Scene needs to resave in case it is closed immediately after copying
		Editor.Scene.callSceneScript('scene-save-as', 'save-scene');
	},

	markReskinned() {
		this.isReskinned = true;
	},

	onDestroy() {
		this._ipc.clear();
	},
});
