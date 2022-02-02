const BaseMissionStepComponent = require('BaseMissionStepComponent');

const StringType = cc.Enum({
	FormatString: 0,
	SlotName: 1,
});

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: cc.Label,
		executeInEditMode: true,
		menu: 'Labels/Missions/Simple Step Description Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562692173/Mission+Step+Description+Label'
	},

	properties: {
		stringType: {
			default: StringType.FormatString,
			type: StringType,
			notify: function(old) {
				if (this.stringType !== old) {
					this.onUpdateMissionStepData();
				}
			}
		},

		
		slotFallbackString: {
			default: "",
			visible: function(){
				return this.stringType === StringType.SlotName;
			},
			tooltip: "What the text the label will fallback to  if this is a SlotName label but the mission step is an any machine type step"
		},
		
	},

	_formatLabel: function(string) {
		const data = this.missionStepInterface.getTemplateStringData();

		const PROPERTY_REGEX = /{(.*?)}/g;
		const formattedString = string.replace(PROPERTY_REGEX, (match, propertyName) => {
			return (data[propertyName] == null) ? '' : data[propertyName];
		});
		this.getComponent(cc.Label).string = formattedString;
	},

	onUpdateMissionStepData: function() {
		let string = "";
		switch(this.stringType) {
			case StringType.FormatString: 
				string = this.missionStepInterface.getFormatString(); 
				break;
			case StringType.SlotName: 
				const data = this.missionStepInterface.getTemplateStringData();
				string = data.slotname || this.slotFallbackString; 
				break;
		}
		this._formatLabel(string);
	},
});