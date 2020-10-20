
const StepStatusComponent = require('StepStatusComponent');

cc.Class({
    extends: cc.Component,

    properties: {
        stepIdNode: {
			default: null,
            type: StepStatusComponent,
        },
        iconStatus: 'locked',
        iconActive: cc.SpriteFrame,
        iconCompleted: cc.SpriteFrame,
        iconLocked: cc.SpriteFrame,
    },

    start: function() {
        const stepStatusComp = this.stepIdNode;
        if (stepStatusComp) {
            this.iconStatus = stepStatusComp.stepStatus;
            this.updateIconSprite();
        }
    },

    updateIconSprite: function() {
        const sprite = this.node.getComponent(cc.Sprite);
        if (sprite) {
            switch (this.iconStatus) {
                case 'active': 
                    sprite.spriteFrame = this.iconActive;
                    break;
                case 'complete':
                case 'redeemed':
                    sprite.spriteFrame = this.iconCompleted;
                    break;
                case 'locked':
                    sprite.spriteFrame = this.iconLocked;
                    break;
    
            }
        }
    },
});
