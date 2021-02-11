// Component to exclude the node tree from the runtime scene definition
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		executeInEditMode: true,
		disallowMultiple: true,
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
