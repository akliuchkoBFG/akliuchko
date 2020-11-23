
cc.Class({
    extends: cc.Component,

    ontriggerMissionInfoNode: function (data) {
        const animationData = JSON.parse(data);
        this._play(animationData.animationName);
    },

    _play: function(anim) {
        const comp = this.getComponent(cc.Animation);
        if (comp && anim) {
			comp.play(anim);
		}
	},
});
