/* global
	winPadding
*/

// Manages window coordinate system in global space with optional safe areas built in that use SAKit winPadding
const WindowSafeArea = cc.Class({
	name:'WindowSafeArea',
	properties: {
		top: false,
		bottom: false,
		left: false,
		right: false,
	},

	getBottomLeft() {
		const point = cc.Vec2.ZERO;
		if (this.bottom) {
			point.y += winPadding.bottom * g_scale;
		}
		if (this.left) {
			point.x += winPadding.left * g_scale;
		}
		return point;
	},

	getTopRight() {
		const point = cc.pFromSize(cc.director.getWinSize());
		if (this.top) {
			point.y -= winPadding.top * g_scale;
		}
		if (this.right) {
			point.x -= winPadding.right * g_scale;
		}
		return point;
	},
});

module.exports = WindowSafeArea;
