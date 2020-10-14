
const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: {
		requireComponent: cc.Label,
	},

	properties: {
	},

	// use this for initialization
	onLoad: function () {
		this._super();

		this._label = this.getComponent(cc.Label);

		const stepClass = this.missionStepInterface.getStepClass();
		const progress = this.missionStepInterface.getProgressAmount();
		const progressMax = this.missionStepInterface.getProgressMax();

		this._label.string = "Step Class: " + stepClass + "\nProgress: " + progress + " / " + progressMax;
	},

	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});
