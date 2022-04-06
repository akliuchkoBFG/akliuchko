cc.Class({
    extends: sp.Skeleton,

    editor: CC_EDITOR && {
		menu: 'Miscellaneous/Spine Skeleton',
	},

    properties: {
        restart: {
            default: true,
            displayName: "Restart",
            tooltip: "Play animation from start when enabling it on timeline"
        },
    },
    
    onEnable: function () {
        this._super();
        if (this.restart) {
            this.setAnimation(0, this.animation, this.loop);
        }
    }
});
