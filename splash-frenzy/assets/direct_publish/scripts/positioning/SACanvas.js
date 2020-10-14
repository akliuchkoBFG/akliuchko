/* global
	_Scene
*/
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
		scaleMode: {
			default: ScaleMode.Enum['Fit Parent'],
			type: ScaleMode.Enum,
		},
	},

	onLoad: CC_EDITOR ?
	function onLoadEditor() {
		if (!(this.node.parent instanceof cc.Scene)) {
			this.node.removeComponent(this);
			Editor.error(new Error("SACanvas must be a child at the root of the scene"));
		}
		const Flags = cc.Object.Flags;
		this._objFlags |= (Flags.IsPositionLocked | Flags.IsAnchorLocked | Flags.IsRotationLocked | Flags.IsScaleLocked);
		this.node.setAnchorPoint(0.5, 0.5);
		this.node.setRotation(0);
		this.node.setScale(1);

		// Create a dummy canvas component, design resolution won't display in editor without a canvas instance
		this._canvas = new cc.Canvas();
		cc.Canvas.instance = this._canvas;
		this._updateCanvasSize();

		cc.director.on(cc.Director.EVENT_BEFORE_VISIT, this.alignWithScreen, this);
		this.node.on('size-changed', this._updateCanvasSize, this);
	} :
	function onLoad() {
		// Replace the enum with the strategy class that knows how to calculate scale
		this.scaleMode = new ScaleMode(this.scaleMode);
		this.node.setPosition(0, 0);
	},

	destroy: CC_EDITOR && function destroy() {
		this.node.off('size-changed', this._updateCanvasSize, this);
		cc.director.off(cc.Director.EVENT_BEFORE_VISIT, this.alignWithScreen, this);
		this.node.getComponentsInChildren('AutosizeBackground').forEach((comp) => {
			comp.node.removeComponent(comp);
			Editor.log("Automatically removed AutosizeBackground from node: " + comp.node.name);
		});

		if (cc.Canvas.instance === this._canvas) {
			cc.Canvas.instance = null;
		}

		this._super();
	},

	// Called from SAKit after sizing the Cocos Scene
	applyScale() {
		const scale = this.scaleMode.getScale(this.node.getContentSize(), this.node.parent.getContentSize());
		this.node.scale = scale;
	},

	alignWithScreen: function () {
		if (CC_EDITOR) {
			const designSize = this.node.getContentSize();
			this.node.setPosition(designSize.width * 0.5, designSize.height * 0.5);
		}
	},

	_updateCanvasSize() {
		if (CC_EDITOR) {
			const size = this.node.getContentSize();
			_Scene.gizmosView.designSize = [size.width, size.height];
		}
	},
});
