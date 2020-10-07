
module.exports = Object.freeze({
	getScene(node) {
		while(node) {
			if (node instanceof cc.Scene) {
				break;
			}
			node = node.parent;
		}
		return node;
	},
});
