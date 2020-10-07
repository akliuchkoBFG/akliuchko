module.exports = cc.Class({
	name: "NodeReference",
	properties: {
		nodePath: "",
		node: {
			default: null,
			type: cc.Node,
		},

		_type: CC_EDITOR && {
			default: 0,
			editorOnly: true,
		},
		type: CC_EDITOR && {
			set: function (val) {
				if (CC_EDITOR) {
					this._type = val;
				}
			},
			get: function () {
				if (this.nodePath !== '') {
					return 1;
				} else if (this.node != null) {
					return 2;
				}
				return this._type;
			},
		}
	},
	get: function get() {
		if (this.nodePath !== '') {
			const node = cc.find(this.nodePath);
			if (!node) {
				cc.log("[NodeReference] Warning: node path reference set, but node was not found. Path: " + this.nodePath);
			}
			return node;
		} else if (this.node != null) {
			return this.node;
		}
		return null;
	},
});
