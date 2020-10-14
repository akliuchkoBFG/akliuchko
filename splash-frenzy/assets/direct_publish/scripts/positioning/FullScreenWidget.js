const WindowSafeArea = require('WindowSafeArea');

// Sizes and positions a node according to screen dimensions and safe area parameters
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		disallowMultiple: true,
	},

	properties: {
		windowSafeArea: {
			displayName: "Safe Areas",
			default: function() {
				return new WindowSafeArea();
			},
			type: WindowSafeArea,
			tooltip: "Enable to align to specific full screen safe areas for device notches and reserved UI areas. If left unchecked this node will align to full screen dimensions",
		},
	},

	onEnable() {
		this.fitToScreen();
	},

	fitToScreen() {
		// Calculate the desired content size of the node
		const bottomLeft = this.node.parent.convertToNodeSpaceAR(this.windowSafeArea.getBottomLeft());
		const topRight = this.node.parent.convertToNodeSpaceAR(this.windowSafeArea.getTopRight());
		const localSize = cc.pSub(topRight, bottomLeft);
		this.node.setContentSize(localSize.x, localSize.y);

		// Calculate the posiion required to have this node exactly match screen dimensions
		const anchor = this.node._anchorPoint;
		const x = bottomLeft.x + localSize.x * anchor.x;
		const y = bottomLeft.y + localSize.y * anchor.y;
		this.node.setPosition(x, y);
	},
});
