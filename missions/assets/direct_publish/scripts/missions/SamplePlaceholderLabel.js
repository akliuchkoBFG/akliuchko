
const BaseMissionComponent = require('BaseMissionComponent');

cc.Class({
	extends: BaseMissionComponent,

	editor: {
		requireComponent: cc.Label,
	},

	properties: {
		template: {
			default: "",
			tooltip: "template string to display",
		},

	},

	// use this for initialization
	onLoad: function () {
		this._super();
		this._label = this.getComponent(cc.Label);
	},

	onUpdateMissionData: function() {
		this._label.string = this.replacePlaceholders(this.template);
	},

	replacePlaceholders: function(template) {
		// replace {xxx} in template string with value from mission data
		// examples:
		// 	"template ID : {templateID}" 	=> "template ID : 1234"
		// 	"tags : {tags}" => "tags : [badge_vip, test_tag]"
		// "graph type : {mission/stepsNetworkData/graph/type}" => "graph type : sequential"

		let returnString = template;
		const group = returnString.match(/\{(.*?)\}/g);
		group.forEach( match => {
			const key = match.replace(/[\{\}]/g, "");
			returnString = returnString.replace(match, JSON.stringify(this.getValue(key, this.missionInterface._missionData)));
		});
		return returnString.replace("\\n", "\n");
	},

	getValue: function(key, missionData) {
		return key.split("/").reduce( (slice, k) => slice[k] , missionData);
	}
});
