cc.Class({
    extends: cc.Component,

    properties: {
        animatedChestContainer: {
            default: null,
            type: cc.Node,
        },
    },

    onLoad: function () {
        if (this.animatedChestContainer) {
            this.animatedChestComp = this.animatedChestContainer.getComponent(cc.Animation);
            this.chestButtonAniamtion = this.node.getComponent(cc.Animation);
            this.animatedChestComp.on('finished', this.onCompleteChestTapAnimation, this);
            this.node.getComponent(cc.Button).interactable = true;
        }
    },

    onCompleteChestTapAnimation: function (e) {
        if (!e.detail || !e.detail.name) {
			return;
        }
        if (e.detail.name == 'chest_tap') {
            this.animatedChestComp.play('chest_tap_hide');
            this.chestButtonAniamtion.play('chest_button_on');
            this.node.getComponent(cc.Button).interactable = true;
        }
    },

    triggerTapChestAnimation: function () {
        if (this.animatedChestComp && this.chestButtonAniamtion) {
            this.animatedChestComp.play('chest_tap');
            this.chestButtonAniamtion.play('chest_button_off');
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
