const BaseMissionComponent = require('BaseMissionComponent');
const EditorButtonProperty = require('EditorButtonProperty');

const TagNode = cc.Class({
	name: 'TagNodeSelectorTagNode',

	properties: {
		tag: {
			default: "",
			tooltip: "Tag, full match, case insensitive"
		},
		node: {
			type: cc.Node,
			default: null,
			tooltip: "Node to show if tag is present"
		},
	}
})

cc.Class({
		extends: BaseMissionComponent,

		editor: CC_EDITOR && {
				inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
				executeInEditMode: true,
				menu: 'Missions/Miscellaneous/Mission Tag Node Selector',
		},

		properties: {
				nodes: {
					type: [TagNode],
					default: []
				},
				default: {
					type: cc.Node,
					default: null,
					tooltip: "Default Node to show if no matching tags are found"
				},
				previewButton: {
					default: function() {
						return new EditorButtonProperty('Preview');
					},
					serializable: false,
					type: EditorButtonProperty,
					tooltip: 'Preview selected nodes with the tags of the selected mission in the Mission Interface',
				}
		},

		__preload() {
			if (CC_EDITOR)
				this.previewButton.action = this.previewInEditor.bind(this);
		},

		previewInEditor() {
			if (!CC_EDITOR)
				return;
			this.updateNodes();
		},

		onUpdateMissionData: function() {
			if (CC_EDITOR)
				return;
			this.updateNodes();
		},

		updateNodes: function() {
			const tags = this.missionInterface.getTags().map( function(tag){ return tag.toLowerCase(); });
			let hasActivated = false;
			this.nodes.forEach(tagNode => {
				if (!tagNode || !tagNode.node)
					return
				tagNode.node.active = (tags.indexOf(tagNode.tag) !== -1);
				hasActivated |= tagNode.node.active;
			});
			if (this.default && !hasActivated)
				this.default.active = true;
		}
});
