const ScaleMode = cc.Class({
	name: 'ScaleMode',
	statics: {
		Enum: cc.Enum({
			'None': 0,
			'Fit Parent': 1,
			'Fit Width': 2,
			'Fit Height': 3,
		}),
	},
	ctor() {
		this.mode = arguments[0];
	},
	getScale(nodeSize, parentSize) {
		const scaleStrategy = 'scale' + ScaleMode.Enum[this.mode].replace(' ', '');
		return this[scaleStrategy](nodeSize, parentSize);
	},
	scaleNone() {
		return 1;
	},
	scaleFitParent(nodeSize, parentSize) {
		const scaleX = parentSize.width / nodeSize.width;
		const scaleY = parentSize.height / nodeSize.height;
		return Math.min(scaleX, scaleY);
	},
	scaleFitWidth(nodeSize, parentSize) {
		return parentSize.width / nodeSize.width;
	},
	scaleFitHeight(nodeSize, parentSize) {
		return parentSize.height / nodeSize.height;
	},
});

module.exports = ScaleMode;
