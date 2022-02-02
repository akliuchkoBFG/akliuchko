const MissionRewardTeaser = require('MissionRewardTeaser');
const MissionRewardSequence = require('MissionRewardSequence');
const EditorOnly = require('EditorOnly');

cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		menu: 'Tools/Debug/Reward Editor Preview',
		executeInEditMode: true,
	},

	properties: {
		previewIndex: {
			default: 0,
			type: cc.Integer,
			tooltip: "Index of reward prefab to preview",
			notify() {
				this._updatePreviewNode();
			}
		},
		_previewNode: {
			default: null,
			type:cc.Node,
		},
	},

	ctor() {
		this._objFlags |= cc.Object.Flags.EditorOnly;
	},

	onEnable() {
		if (!this._previewNode) {
			this._updatePreviewNode();
		}
	},

	_updatePreviewNode() {
		if (!CC_EDITOR) {
			return;
		}
		if (this._previewNode) {
			this._previewNode.removeFromParent();
			this._previewNode = null;
		}
		const rewardComponent = this.getComponent(MissionRewardTeaser) || this.getComponent(MissionRewardSequence);
		if (!rewardComponent) {
			Editor.error("[MissionRewardPreview] Preview failed, must attach component to node with MissionRewardTeaser or MissionRewardSequence");
			return;
		}
		const prefabs = rewardComponent.rewardPrefabs;
		if (!prefabs) {
			Editor.error("[MissionRewardPreview] Unexpected error");
			return;
		}
		// Wrap around the index if it passes the boundaries of the rewards prefabs array
		if (this.previewIndex >= prefabs.length || this.previewIndex < 0) {
			this.previewIndex = (this.previewIndex % prefabs.length + prefabs.length) % prefabs.length;
			return;
		}
		const prefab = prefabs[this.previewIndex];
		if (!prefab) {
			Editor.warn('[MissionRewardPreview] No prefab found for index: ' + this.previewIndex);
			return;
		}
		this._previewNode = cc.instantiate(prefab);
		this._previewNode.addComponent(EditorOnly);
		this.node.addChild(this._previewNode);
	},

	onDisable() {
		if (this._previewNode) {
			this._previewNode.removeFromParent();
			this._previewNode = null;
		}
	},
});
