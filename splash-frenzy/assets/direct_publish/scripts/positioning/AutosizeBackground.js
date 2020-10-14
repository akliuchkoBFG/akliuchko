// 
// AutosizeBackground
// 
// A component for automatically sizing a background node based on SACanvas contstraints
// A node with this component will be automatically sized to show the dimensions needed
// to have a background that covers the full screen for any device aspect ratio
// Logic is primarily editor only and does not dynamically change anything at runtime
// 

// A series of supported aspect ratios, portrait-oriented height/width
// Min aspect ratio informs how wide to size the background relative to canvas
// Max aspect ratio informs how tall to size the background relative to canvas
const AspectRatios = [
	4/3, // iPad
	19.5/9, // iPhone X
	3/2, // iPhone 4S
	17/10, // Android Tablets
	16/10, // Android Tablets
	16/9, // Wide range of Apple/Android phones
	18/9, // Pixel 2 XL
];

const MIN_ASPECT = Math.min(...AspectRatios);
const MAX_ASPECT = Math.max(...AspectRatios);

const SACanvas = require('SACanvas');
const ScaleMode = require('ScaleMode');

cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		// Needs to execute in edit mode to prevent from being added to improper nodes
		// Scale/Sizing logic will only apply at runtime
		executeInEditMode: true,
		disallowMultiple: true,
	},

	properties: {
		canvas: {
			default: null,
			type: SACanvas,
			editorOnly: true,
			visible: false,
		},
	},

	onLoad: CC_EDITOR && function onLoad() {
		const Flags = cc.Object.Flags;
		this._objFlags |= (Flags.IsPositionLocked | Flags.IsAnchorLocked | Flags.IsSizeLocked | Flags.IsRotationLocked | Flags.IsScaleLocked);
		this._dirty = true;
		// Autoset canvas property
		if (!this.canvas) {
			// This could potentially support a deeper nested hierarchy, but would require more logic
			// to capture and listen to the transforms between this node and the canvas view
			try {
				this.canvas = this.node.parent.getComponent(SACanvas);
				if (!this.canvas) {
					throw new Error('No SACanvas');
				}
			} catch (e) {
				Editor.error("AutosizeBackground needs to be added to a direct child of SACanvas");
				this.node.removeComponent(this);
			}
		}
		if (this.canvas.scaleMode !== ScaleMode.Enum['Fit Parent']) {
			Editor.warn("AutosizeBackground only supports the 'Fit Parent' Scale Mode on SACanvas");
		}
	},

	onEnable: CC_EDITOR && function onEnable() {
		this.canvas.node.on('size-changed', this._doDirty, this);
		this.node.on('size-changed', this._doDirty, this);
		cc.Class.attr(this.node, 'position', {readonly: true});
	},

	onDisable: CC_EDITOR && function onDisable() {
		this.canvas.node.off('size-changed', this._doDirty, this);
		this.node.off('size-changed', this._doDirty, this);
	},

	_doDirty() {
		this._dirty = true;
	},

	update: CC_EDITOR && function update() {
		if (this._dirty) {
			const canvasSize = this.canvas.node.getContentSize();
			const bgSize = {
				width: Math.max(canvasSize.width, canvasSize.height / MIN_ASPECT), 
				height: Math.max(canvasSize.height, canvasSize.width * MAX_ASPECT),
			};
			this.node.setContentSize(bgSize);
			this._dirty = false;
		}
	},
});
