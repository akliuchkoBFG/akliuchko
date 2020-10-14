const BaseMissionComponent = require('BaseMissionComponent');

cc.Class({
	extends: BaseMissionComponent,

	editor: {
		requireComponent: cc.Label,
	},

	properties: {
	},

	// use this for initialization
	onLoad: function () {
		this._super();

		this._label = this.getComponent(cc.Label);
		this._label.string = "Template ID: " + this.missionInterface.getTemplateID();
	},

	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});
