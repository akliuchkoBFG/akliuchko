
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		menu: 'Marketing/Pokeable',
		requireComponent: cc.Button,
	},

	properties: {
		spineAnimation: {
			default: null,
			type: sp.Skeleton,
		},
		activeAnimation: {
			default: 'active',
			displayName: 'Poke Animation',
			tooltip: 'Animation to play when poked',
		},
		idleAnimation: {
			default: 'idle',
			tooltip: 'Idle Animation to play after poke animation (reset)',
		},
	},

	onLoad: function() {
		this._button = this.getComponent(cc.Button);

		const clickEvent = new cc.Component.EventHandler();
		clickEvent.target = this.node;
		clickEvent.component = this.__classname__;
		clickEvent.handler = 'onSpineClick';
		this._button.clickEvents.push(clickEvent);
	},

	onSpineClick: function() {
		if (this.spineAnimation.animation !== this.activeAnimation) {
			this.spineAnimation.setAnimation(0, this.activeAnimation, false);
			this.spineAnimation.addAnimation(0, this.idleAnimation, true);
		}
	},
});
