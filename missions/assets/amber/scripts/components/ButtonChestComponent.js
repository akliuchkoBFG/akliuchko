cc.Class({
    extends: cc.Component,

    properties: {
        animatedChestContainer: {
            default: null,
            type: cc.Node,
        },
        chestButtonParent: {
            default: null,
            type: cc.Node,
        }
    },

    onLoad: function () {
        if (this.animatedChestContainer) {
            this.animatedChestComp = this.animatedChestContainer.getComponent(cc.Animation);
            this.buttonParentAnimation = this.chestButtonParent.getComponent(cc.Animation);
            this.animatedChestComp.on('finished', this.onCompleteChestTapAnimation, this);
            this.node.getComponent(cc.Button).interactable = true;
        }
    },

    onCompleteChestTapAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'chest_tap') {
            const animatedChest = this.animatedChestContainer.getChildByName('animated_chest');
            this.buttonParentAnimation.play('chest_button_on');

            // Hide active Animated chest spine prefab on animation finish , this is needed to fix a glithch in animation. 
            if (animatedChest) {
                const chestTap = animatedChest.getChildByName('chest_tap');
                setTimeout(() => {
                    chestTap.active = false;
                }, 150);
            }

            this.node.getComponent(cc.Button).interactable = true;
        }
    },

    triggerTapChestAnimation: function () {
        if (this.animatedChestComp && this.buttonParentAnimation) {
            this.animatedChestComp.play('chest_tap');
            this.buttonParentAnimation.play('chest_button_off');
            this.node.getComponent(cc.Button).interactable = false;
        }
    },

    toggleButtonInteractable: function () {
        const buttonComp = this.node.getComponent(cc.Button)
        if (buttonComp && buttonComp.interactable) {
            buttonComp.interactable =  !buttonComp.interactable;
        }
    },
});
