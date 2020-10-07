const NodeReference = require("NodeReference");

cc.Class({
    extends: cc.Component,
    properties: {
      prefab:cc.Prefab,
      endNode: {
        default: function () {
          return new NodeReference();
        },
        visible: true,
        type: NodeReference,
      }
    },

    onLoad: function () {
        this.loadAnimatedItem();
    },

    loadAnimatedItem() {
		if (!this.prefab) {
			return Promise.resolve();
		}
		
        const node = cc.instantiate(this.prefab);
        node.parent = this.node.parent;
	},

});
