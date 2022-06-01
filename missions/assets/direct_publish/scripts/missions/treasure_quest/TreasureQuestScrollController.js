const TAG = "TreasureQuestScrollController";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/TreasureQuest/ScrollController',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		requireComponent: cc.ScrollView,
	},

	properties: {
		scrollView: {
		   default: null,
		   type: cc.ScrollView,
		   visible: false,
		},
		verticalOffset: { // diff between viewport (mask) height and content height.
			default: 0,
			visible: false,
		},
		scrollSpeed: {
			default: 500,
			visible: true,
		},
		originOffset: {
			default: 0,
			visible: true,
		}
	},

	onLoad: function () {
		this.scrollView = this.node.getComponent(cc.ScrollView);
		this.verticalOffset = this.scrollView.getScrollOffset().y - this.node.height;
	},

	disableScroll: function() {
		this.scrollView.enabled = false;
	},

	enableScroll: function() {
		this.scrollView.enabled = true;
	},

	setupToChildNode(nodeName) {
		if(!this.scrollView) return;
		const item = this.scrollView.content.getChildByName(nodeName);
		if(!item) return;
		const newPos = item.position.y + this.originOffset;
		const percent = Math.max(0, Math.min(newPos / this.verticalOffset, 1));
		this.scrollView.scrollToPercentVertical(percent, 0);
	},

	scrollToChildNode(nodeName) {
		if(!this.scrollView) return Promise.resolve();
		const item = this.scrollView.content.getChildByName(nodeName);
		if(!item) return Promise.resolve();

		const newPos = item.position.y + this.originOffset;
		const percent = -1 * Math.max(0, Math.min(newPos / this.verticalOffset, 1)); // -1 -> direction
		const distance = Math.min(newPos, this.verticalOffset) - Math.abs(this.scrollView.content.position.y);
		const time = Math.abs(distance / this.scrollSpeed);
		this.disableScroll();
		return new Promise((resolve) => {    
			this.scrollView.content.runAction(cc.sequence(
				cc.moveTo(time, this.scrollView.content.position.x, percent * this.verticalOffset ), 
				cc.delayTime(0.1),
				cc.callFunc(() => {
					this.enableScroll();
					resolve();
				})
			));
		});        
	},
});


