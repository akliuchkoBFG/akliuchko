cc.Class({
    extends: cc.Component,

    properties: {
        chest: {
            default: null,
            type: sp.SkeletonData,
        },
    },

    // use this for initialization
    onLoad: function () {
        cc.log(this.chest);
    },
});
