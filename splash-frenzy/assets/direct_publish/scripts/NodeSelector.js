cc.Class({
	extends: cc.Component,

	properties: {
		nodesAssigned: {
			default: [],
			type: [cc.Node],
			tooltip: "If no nodes are assigned, the child nodes will be sed instead",
		},

		selection: {
			default: 0,
			min: 0,
			step: 1,
			notify: function() {
				this.selectNode(this.selection);
			}
		},
	},

	onLoad: function() {
		this._activeNode = null;
	},

	start: function() {
		this.selectNode(this.selection);
	},

	selectNode: function(index) {
		const nodes = (this.nodesAssigned.length) ? this.nodesAssigned : this.node.children;
		const selection = index % nodes.length;
		if (selection !== this.selection) {
			this.selection = selection;
			return this._activeNode;
		}

		this._activeNode = null;
		for (let i=0; i < nodes.length; ++i) {
			if (nodes[i]) {
				if (i === selection) {
					nodes[i].active = true;
					this._activeNode = nodes[i];
				} else {
					nodes[i].active = false;
				}
			}
		}

		return this._activeNode;
	},

	getActiveNode() {
		return this._activeNode;
	}

	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});
