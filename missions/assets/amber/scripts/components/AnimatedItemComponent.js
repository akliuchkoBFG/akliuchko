const NodeReference = require("NodeReference");

cc.Class({
    extends: cc.Component,
    properties: {
        prefab: cc.Prefab,
        endNode: {
            default: function () {
                return new NodeReference();
            },
            visible: false,
            type: NodeReference,
        }
    },

    onLoad: function () {
        this.loadAnimatedItem();
    },

    update: function() {
        if (!this.nodeActive) {
            this.loadAnimatedItem();
        }
    },

    onDisable: function () {
        this.nodeActive = false;
        this.endNode.destroy();
    },

    loadAnimatedItem() {
        if (!this.prefab) {
            return Promise.resolve();
        }
        this.endNode = cc.instantiate(this.prefab);
        this.endNode.parent = this.node.parent;
        this.nodeActive = true;
    },
});
