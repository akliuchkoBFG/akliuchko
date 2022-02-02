const TAG = 'ScrollViewContentAnimation';
const ComponentLog = require('ComponentSALog')(TAG);
const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';

const DebugLabelType = cc.Enum({
	Percentage: 1,
	Frame: 2,
});

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: cc.Animation,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		menu: 'Miscellaneous/Scroll Content Animation',
	},

	properties: {
		scrollView: {
			default: null,
			type: cc.ScrollView,
		},
		// Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			[
				'scrollTimeline',
			],
			[
				'Animation component for animating contents based on position in scroll view (required)',
				'Adding this component will reveal animation clip states for the scroll timeline',
			].join('\n')
		),

		scrollTimeline: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation clip representing the timeline to tween through as this node scrolls through the view'
		),

		allowTimelineOverride: {
			default: true,
			tooltip: 'Allows a Scroll Content Animation Controller to replace the configured timeline clip with clips that are defined for the entire scroll view',
		},

		startOffset: {
			default: 0,
			tooltip: [
				"Unit offset relative to the scroll view bounds to use for the start of the animation timeline",
				"Especially useful for scroll views that don't clip or have other reasons not to change size",
			].join('\n'),
		},

		endOffset: {
			default: 0,
			tooltip: [
				"Unit offset relative to the scroll view bounds to use for the end of the animation timeline",
				"Especially useful for scroll views that don't clip or have other reasons not to change size",
			].join('\n'),
		},

		debugLabel: {
			default: null,
			type: cc.Label,
			tooltip: "Show a debug label that shows information about the animation",
		},

		debugLabelType: {
			default: DebugLabelType.Percentage,
			type: DebugLabelType,
			tooltip: "Display as interpolation percentage or animation frame number?",
		},
	},

	onEnable() {
		this.initialize();
	},

	initialize() {
		if (this.scrollView) {
			this.scrollView.node.off('scrolling', this.onScroll, this);
			this._calculateContentBounds();
			// Get anim clip duration
			const animName = this.scrollTimeline.clipName;
			if (!animName) {
				this.log.e("No animation clip");
				return;
			}
			const state = this.animation.getAnimationState(animName);
			if (!state) {
				this.log.e("No animation state");
				return;
			}
			this._animName = animName;
			this._duration = state.duration;

			// Listen for scroll view events
			this.scrollView.node.on('scrolling', this.onScroll, this);
			// Initialize animation to keyframe based on current position in scroll view
			this.onScroll();
		} else {
			this.log.e("No scroll view");
		}
	},

	// Getting the position of an individual piece of content inside the scroll view container requires
	//  a lot of transform math undesirable for running on a fast update (like a scrolling event callback)
	// To help alleviate this, pre-calculate the position of the content view inside the larger scroll view
	//  where the content node timeline should start and where the content node timeline should end
	_calculateContentBounds() {
		if (!this.scrollView.content) {
			this.log.e("No scroll view content");
			return;
		}
		const scrollContent = this.scrollView.content;
		const nodeTopLeft = cc.p(this.node.anchorX * -this.node.width, this.node.anchorY * this.node.height);
		const nodeBottomRight = cc.p(this.node.anchorX * this.node.width, this.node.anchorY * -this.node.height);
		const contentTopLeft = scrollContent.convertToNodeSpaceAR(this.node.convertToWorldSpaceAR(nodeTopLeft));
		const contentBottomRight = scrollContent.convertToNodeSpaceAR(this.node.convertToWorldSpaceAR(nodeBottomRight));
		const scrollNode = this.scrollView.node;
		const scrollTopLeft = cc.p(scrollNode.anchorX * -scrollNode.width, scrollNode.anchorY * scrollNode.height);
		const scrollBottomRight = cc.p(scrollNode.anchorX * scrollNode.width, scrollNode.anchorY * -scrollNode.height);

		// Content start point is when distance between the bottom right of the node and top left of the viewport is zero
		this._contentStart = cc.pSub(scrollTopLeft, contentBottomRight);
		// Add start offset
		this._contentStart = cc.pAdd(this._contentStart, cc.p(-this.startOffset, this.startOffset));
		// Content end point is when distance between the top left of the node and bottom right of the viewport is zero
		this._contentEnd = cc.pSub(scrollBottomRight, contentTopLeft);
		// Add end offset
		this._contentEnd = cc.pAdd(this._contentEnd, cc.p(this.endOffset, -this.endOffset));

		// Constrain content points to scroll view direction
		this._contentStart = this.scrollView._flattenVectorByDirection(this._contentStart);
		this._contentEnd = this.scrollView._flattenVectorByDirection(this._contentEnd);
	},

	onScroll() {
		// Update animation to keyframe based on current position in scroll view
		const t = this._getTValue();
		if (this.debugLabel && this.debugLabelType === DebugLabelType.Percentage) {
			// Show t value as a percentage with one decimal
			const percentage = Math.floor(t * 1000) / 10;
			this.debugLabel.string = percentage + "%";
		}
		this._updateAnimationTimeline(t);
	},

	// Get the interpolation value [0, 1] for the current content position between the start and end points
	// Interpolation defaults to y-axis if scroll view is not constrained
	_getTValue() {
		const contentPosition = this.scrollView._flattenVectorByDirection(this.scrollView.getContentPosition());
		const axis = (this.scrollView.vertical) ? 'y' : 'x';
		const startPos = this._contentStart[axis];
		const currentPos = contentPosition[axis];
		const endPos = this._contentEnd[axis];
		let t = (currentPos - startPos) / (endPos - startPos);
		t = Math.max(0, Math.min(1, t));
		return t;
	},

	_updateAnimationTimeline(t) {
		if (!this._animName) {
			return;
		}
		const time = this._duration * t;
		this.animation.setCurrentTime(time, this._animName);
		if (this.debugLabel && this.debugLabelType === DebugLabelType.Frame) {
			const animState = this.animation.getAnimationState(this._animName);
			let frame = Math.round(animState.frameRate * animState.time);
			if (CC_EDITOR) {
				// Format the frame display using the same logic as the timeline if available
				frame = Editor.Utils.formatFrame(frame, animState.frameRate);
			}
			this.debugLabel.string = frame;
		}
	},

	onDisable() {
		if (this.scrollView && this.scrollView.node) {
			this.scrollView.node.off('scrolling', this.onScroll, this);
		}
	},
});
