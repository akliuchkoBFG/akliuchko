// Component to exclude the node tree from the runtime scene definition
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		executeInEditMode: true,
		disallowMultiple: true,
		menu: 'Tools/Edtior Only',
	},
	properties: {
	},

	onLoad() {
		this.node._objFlags |= cc.Object.Flags.EditorOnly;
	},

	onDestroy() {
		this.node._objFlags &= (~cc.Object.Flags.EditorOnly);
	},
});
