const Padding = cc.Class({
	name: "AutoSpacePadding",
	properties: {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	},
});

const Spacing = cc.Class({
	name: "AutoSpaceSpacing",
	properties: {
		spacingX: 0,
		spacingY: 0,
	},
});

const LayoutDirection = cc.Enum({
	Both: 0,
	Horizontal: 1,
	Vertical: 2,
});

const AutoSpaceLayout = cc.Class({
	name: "AutoSpaceLayout",
	properties: {
		layout: {
			default: null,
			type: cc.Layout,
			tooltip: "Layout component to apply automatic spacing properties. Clear this reference to prevent automatic layout spacing",
			notify: CC_EDITOR ? function() {
				this._checkLayoutDirection();
			} : function() {},
		},
		_automaticCellSize: false,
		cellSize: {
			default: cc.Size.ZERO,
			visible: function() {
				return this.layout !== null && !this._automaticCellSize;
			},
		},
		cellCount: {
			default: 0,
			visible: false,
			editorOnly: true,
			readonly: true,
			tooltip: "(DEBUG) Number of cells that can be shown with the current size of the node",
		},
		minPadding: {
			default: function () {
				return new Padding();
			},
			type: Padding,
			visible: function() {
				return this.layout !== null;
			},
			tooltip: "Minimum acceptable padding parameters for the layout",
		},
		minSpacing: {
			default: function () {
				return new Spacing();
			},
			type: Spacing,
			visible: function() {
				return this.layout !== null;
			},
			tooltip: "Minimum acceptable spacing parameters for the layout",
		},
		paddingRatio: {
			displayName: "Padding/Spacing Ratio",
			default: 0.5,
			range: [0, 1.0, 0.1],
			slide: true,
			visible: function() {
				return this.layout !== null;
			},
			tooltip: "Amount of extra space to assign to padding vs spacing between cells.\n0 = All extra space added to spacing\n1 = All extra space added to padding",
		},
		_layoutDirection: {
			default: LayoutDirection.Both,
			type: LayoutDirection,
		},
		layoutDirection: {
			type: LayoutDirection,
			visible: function() {
				return this.layout !== null;
			},
			get: function() {
				return this._layoutDirection;
			},
			set: function(val) {
				this._layoutDirection = val;
				this._checkLayoutDirection();
			},
			tooltip: "Optionally apply automatic spacing to one direction only, layout parameters for the opposite direction will remain as set in editor properties. This may be automatically set based on the layout Type and Resize Mode.",
		},
	},

	// Restrict layout direction options based on layout parameters
	_checkLayoutDirection() {
		if (!this.layout || this.layout.resizeMode !== cc.Layout.ResizeMode.CONTAINER) {
			// Does not need to restrict layout direction
			return;
		}
		if (this.layout.type === cc.Layout.Type.GRID) {
			if (this.layout.startAxis === cc.Layout.AxisDirection.HORIZONTAL) {
				this._layoutDirection = LayoutDirection.Horizontal;
			} else {
				this._layoutDirection = LayoutDirection.Vertical;
			}
		} else if (this.layout.type === cc.Layout.Type.HORIZONTAL) {
			this._layoutDirection = LayoutDirection.Vertical;
		} else if (this.layout.type === cc.Layout.Type.VERTICAL) {
			this._layoutDirection = LayoutDirection.HORIZONTAL;
		}
	},

	applySpacingToLayout() {
		if (!this.layout || this.cellSize.equals(cc.Size.ZERO)) {
			return;
		}
		const layoutSize = this.layout.node.getContentSize();
		// Horizontal spacing
		if (this.layoutDirection !== LayoutDirection.Vertical) {
			const minPadding = this.minPadding.left + this.minPadding.right;
			const maxCells = this.layout.type !== cc.Layout.Type.GRID ? 1 : Number.MAX_SAFE_INTEGER;
			const extraSpace = this._calculateExtraSpace(this.cellSize.width, layoutSize.width, minPadding, this.minSpacing.spacingX, maxCells);
			this.layout.paddingLeft = this.minPadding.left + extraSpace.padding;
			this.layout.paddingRight = this.minPadding.right + extraSpace.padding;
			this.layout.spacingX = this.minSpacing.spacingX + extraSpace.spacing;
		}

		// Vertical spacing
		if (this.layoutDirection !== LayoutDirection.Horizontal) {
			const minPadding = this.minPadding.top + this.minPadding.bottom;
			const maxCells = this.layout.type !== cc.Layout.Type.GRID ? 1 : Number.MAX_SAFE_INTEGER;
			const extraSpace = this._calculateExtraSpace(this.cellSize.height, layoutSize.height, minPadding, this.minSpacing.spacingY, maxCells);
			this.layout.paddingTop = this.minPadding.top + extraSpace.padding;
			this.layout.paddingBottom = this.minPadding.bottom + extraSpace.padding;
			this.layout.spacingY = this.minSpacing.spacingY + extraSpace.spacing;
		}
	},

	_calculateExtraSpace(cell, total, minPadding, minSpacing, maxCells) {
		// Minimum amount of space needed for each cell
		const cellSpace = cell + minSpacing;
		// Total available space to use for laying out cells
		// minSpacing is added because the layout needs one less unit of spacing than the number of cells
		const totalSpace = total - minPadding + minSpacing;
		let numCells = Math.floor(totalSpace / cellSpace);
		// Clamp to [1, maxCells]
		numCells = Math.max(1, Math.min(numCells, maxCells));
		this.cellCount = numCells;
		const extraSpace = totalSpace - (numCells * cellSpace);
		// Force all extra space to padding for single cell
		const paddingRatio = numCells > 1 ? this.paddingRatio : 1.0;
		return {
			padding: paddingRatio * extraSpace / 2,
			spacing: (1 - paddingRatio) * extraSpace / numCells,
		};
	},
});

module.exports = AutoSpaceLayout;
