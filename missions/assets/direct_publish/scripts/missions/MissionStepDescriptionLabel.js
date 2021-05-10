const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const MissionTextConfiguration = require('MissionTextConfiguration');

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Add Mission Component/Step Description Label',
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562692173/Mission+Step+Description+Label'
	},

	properties: {
		textConfiguration: {
			default: null,
			type: MissionTextConfiguration,
			tooltip: 'Optional text configuration component for centralized configuration of template strings',
		},
	},

	onUpdateMissionStepData: function() {
		const rtLabel = this.getComponent('DataTemplateRichTextLabel');
		const description = this.missionStepInterface.getFormatString();
		const templateData = this.missionStepInterface.getTemplateStringData();
		const stepClass = this.missionStepInterface.getStepClass();
		if (this.textConfiguration) {
			// Using centralized config for template strings rather than modifying individual labels
			const templateString = this.textConfiguration.getTemplateString(stepClass, templateData);
			rtLabel.templateString = templateString;
		} else if (!rtLabel.templateString || rtLabel.templateString === '') {
			rtLabel.templateString = description;
		}

		// Clear out template string before passing along to avoid confusion
		templateData.templateString = null;
		rtLabel.setData(templateData);
		// Set the editor mode properties
		if (CC_EDITOR) {
			rtLabel.testData = JSON.stringify(templateData, null, '\t');
		}
	},
});