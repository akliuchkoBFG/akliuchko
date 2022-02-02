const TAG = "MissionTextConfiguration";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionStepInterface = require('MissionStepInterface');
const MissionTextConfigurationOption = require('MissionTextConfigurationOption');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const EditorButtonProperty = require('EditorButtonProperty');

cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: MissionStepInterface,
		executeInEditMode: true,
		menu: 'Labels/Missions/Step Text Configuration',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		// Editor preview ease of use
		previewLabel: {
			default: null,
			type: DataTemplateRichTextLabel,
			tooltip: '(optional) Cycle through preview of each step\'s description by setting this node and adjusting the preview stepID below',
			editorOnly: true,
		},
		previewStepID: {
			default: 0,
			type: cc.Integer,
			min: 0,
			notify() {
				if (!CC_EDITOR || !this.previewLabel) {
					return;
				}
				const stepInterface = this.getComponent(MissionStepInterface);
				const stepIDs = stepInterface.missionInterface.getAllStepIDs();
				if (this.previewStepID >= stepIDs.length) {
					this.previewStepID = 0;
					return;
				}
				const stepID = stepIDs[this.previewStepID];
				stepInterface.useActiveStepIDOnly = false;
				stepInterface.stepID = stepID;
				stepInterface._updateStepData();
				const stepClass = stepInterface.getStepClass();
				const templateData = stepInterface.getTemplateStringData();
				const templateString = this.getTemplateString(stepClass, templateData);
				this.previewLabel.templateString = templateString;
				this.previewLabel.setData(templateData);
			},
			visible() {
				return !!this.previewLabel;
			},
			tooltip: 'Change this to preview the rich text label for a different stepID',
		},

		// Editor configuration helper
		searchButton: {
			default: function() {
				return new EditorButtonProperty('Check Template');
			},
			serializable: false,
			type: EditorButtonProperty,
			tooltip: 'Inspect current mission template for new configuration options to add automatically',
		},

		// Configuration interface
		configs: {
			default: [],
			type: [MissionTextConfigurationOption],
			tooltip: 'List of text configuration options',
		},
	},


	__preload() {
		if (CC_EDITOR) {
			this.searchButton.action = this.checkTemplateForUpdates.bind(this);
		}
	},

	checkTemplateForUpdates() {
		if (!CC_EDITOR) {
			return;
		}
		Editor.log("Checking mission template for unique text configuration options");
		const stepInterface = this.getComponent(MissionStepInterface);
		const missionInterface = stepInterface.missionInterface;
		if (!missionInterface) {
			Editor.error("Mission interface not found on step interface, unable to check for new template strings");
		}
		const allStepIDs = missionInterface.getAllStepIDs();
		stepInterface.useActiveStepIDOnly = false;
		allStepIDs.forEach((stepID) => {
			stepInterface.stepID = stepID;
			// Update step data silently without emitting for editor only behavior
			stepInterface._updateStepData();
			const stepClass = stepInterface.getStepClass();
			const templateData = stepInterface.getTemplateStringData();
			const existingConfig = this.configs.find((c) => {
				return c.supportsStep(stepClass, templateData);
			});
			if (existingConfig == null) {
				// Config that supports the step type was not found, create a new configuration option
				const newConfig = new MissionTextConfigurationOption();
				newConfig.setupWithStep(stepClass, templateData);
				Editor.log("Adding new text configuration option for " + newConfig.description);
				this.configs.push(newConfig);
			}
		});
		Editor.success("Finished checking mission template for text configurations");
	},

	getTemplateString(stepClass, templateData) {
		let config = this.configs.find((c) => {
			return c.supportsStep(stepClass, templateData);
		});
		if (config == null) {
			// Config was not setup at runtime, fall back to default
			config = new MissionTextConfigurationOption();
			config.setupWithStep(stepClass, templateData);
			this.log.w("Custom text configuration not found for " + config.description + "; using default template string");
		}
		return config.templateString;
	},
});