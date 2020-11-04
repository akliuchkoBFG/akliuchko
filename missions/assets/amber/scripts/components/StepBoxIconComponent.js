
const StepBoxComponent = require('StepBoxComponent');

cc.Class({
    extends: cc.Component,

    properties: {
        stepIdNode: {
			default: null,
            type: StepBoxComponent,
        },
        iconStatus: 'locked',
        iconActive: cc.SpriteFrame,
        iconCompleted: cc.SpriteFrame,
        iconLocked: cc.SpriteFrame,
    },

    update: function () {
        if (this.stepIdNode && this.iconStatus !== this.stepIdNode.stepStatus) {
            this.updateIconSprite();
        }
    },

    onEnable: function() {
        const stepBoxComp = this.stepIdNode;
        if (stepBoxComp) {
            this.updateIconSprite();
        }
    },

    updateIconSprite: function() {
        const sprite = this.node.getComponent(cc.Sprite);

        this.iconStatus = this.stepIdNode.stepStatus;
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
