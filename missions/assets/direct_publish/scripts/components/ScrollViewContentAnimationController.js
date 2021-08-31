const ScrollViewContentAnimation = require('ScrollViewContentAnimation');
const EditorButtonProperty = require('EditorButtonProperty');

const TAG = 'ScrollViewContentAnimationController';
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		menu: 'Add SAG Component/Scroll Content Animation Controller',
		executeInEditMode: true,
	},

	properties: {
		scrollView: {
			default: null,
			type: cc.ScrollView,
		},
		primaryClip: {
			default: null,
			type: cc.AnimationClip,
			tooltip:[ 
				"Animation clip to attach to all animating nodes in the scroll view.",
				"If a secondary clip is also configured, this will only be used for even nodes",
			].join('\n'),
		},
		secondaryClip: {
			default: null,
			type: cc.AnimationClip,
			tooltip:[ 
				"Animation clip to attach to all animating nodes in the scroll view.",
				"This will only be used for odd nodes",
			].join('\n'),
		},

		previewScrollPercent: {
			default: 0,
			type: cc.Float,
			range: [0, 100],
			slide: true,
			tooltip: "Percentage to scroll content for simulating scroll position using the preview in scene button",
		},

		previewButton: {
			default: function() {
				return new EditorButtonProperty('Preview In Scene');
			},
			serializable: false,
			type: EditorButtonProperty,
			tooltip: 'Preview scroll view animation in scene by applying animation timeline to nodes in the hierarchy. WARNING: This cannot be undone',
		},

		_contentAnimations: {
			default: [],
			type: [ScrollViewContentAnimation],
			serializable: false,
		},
	},

	__preload() {
		if (CC_EDITOR) {
			this.previewButton.action = this.previewInEditor.bind(this);
		}
	},

	onEnable() {
		if (CC_EDITOR) {
			return;
		}
		this.refreshScrollAnimation();
		if (this.scrollView) {
			// Page updates usually require updating the content bounds of content nodes
			this.scrollView.node.on('pages-update', this.refreshScrollAnimation, this);
		}
	},

	previewInEditor() {
		if (!CC_EDITOR) {
			return;
		}
		if (!this._userWarned) {
			const electron = require('electron'); // eslint-disable-line global-require
			const dialog = electron.remote.dialog;
			// Current version of electron only has synchronous API for dialog functions
			//  but it's named like the async API of future versions, force the sync API
			const showMessageBoxSync = dialog.showMessageBoxSync || dialog.showMessageBox;
			const dialogResponse = showMessageBoxSync({
				title: 'Warning',
				message: [
					'This action can update arbitrary node properties in the scene from animation timelines and cannot be undone.',
					'Continue?'
				].join('\n'),
				buttons: ['Yes', 'Cancel'],
			});
			if (dialogResponse === 0) {
				// Mark this component as having warned the user to reduce future dialogs from iterating using this feature
				this._userWarned = true;
			} else {
				// Cancel the in-editor update
				return;
			}
		}

		if (this.scrollView) {
			// Adjust scroll view content position based editor slider
			const anchorValue = this.previewScrollPercent / 100;
			const scrollAnchor = cc.p(anchorValue, anchorValue);
			let moveDelta = this.scrollView._calculateMovePercentDelta({
				anchor:scrollAnchor,
				applyToHorizontal:true,
				applyToVertical:true
			});
			moveDelta = this.scrollView._flattenVectorByDirection(moveDelta);
			const newPosition = cc.pAdd(this.scrollView.getContentPosition(), moveDelta);
			this.scrollView.setContentPosition(newPosition);

			// Simulate scroll animation timelines for current scroll position in-editor
			this.refreshScrollAnimation();
		} else {
			Editor.failed("Cannot preview without a scroll view property");
		}
	},

	refreshScrollAnimation() {
		if (this.scrollView) {
			this._contentAnimations = this.scrollView.node.getComponentsInChildren(ScrollViewContentAnimation);
			this._contentAnimations.forEach((contentAnim, index) => {
				contentAnim.scrollView = this.scrollView;
				const clips = [
					this.primaryClip,
					this.secondaryClip || this.primaryClip,
				];
				const animClip = clips[index % clips.length];
				if (animClip && contentAnim.allowTimelineOverride) {
					contentAnim.scrollTimeline.animationClip = animClip;
				}
				contentAnim.enabled = true;
				contentAnim.initialize();
			});
		} else {
			this.log.e("No scroll view");
		}
	},

	onDisable() {
		if (CC_EDITOR) {
			return;
		}
		if (this.scrollView) {
			this.scrollView.node.off('pages-update', this.refreshScrollAnimation, this);
		}
	},
});
