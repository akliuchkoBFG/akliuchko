function showIfAdvanced() {
	return this.showAdvanced;
}

module.exports = cc.Class({
	name: 'MissionTextConfigurationOption',
	properties: {
		description: {
			get() {
				let desc = this.stepClass;
				if (this.hasBuyInID) {
					desc += ' in specific slot';
				}
				if (this.hasMinBet) {
					desc += ' with a minimum bet';
				}
				return desc;
			},
		},
		stepClass: {
			default: '',
			tooltip: 'Server-side class that determines trackable action type',
			visible: showIfAdvanced,
		},
		hasBuyInID: {
			default: false,
			tooltip: 'Is this a slot step that requires a specific machine?',
			visible: showIfAdvanced,
		},
		hasMinBet: {
			default: false,
			tooltip: 'Is this a slot step that requires a minimum bet amount?',
			visible: showIfAdvanced,
		},
		templateString: {
			default: '',
			multiline: true,
		},
		// Toggling behavior doesn't seem to work when this property is in an array in the editor
		showAdvanced: {
			default: false,
			tooltip: 'Show advanced configuration options',
			visible: false,
		},
		defaultTemplateString: {
			default: '',
			tooltip: 'Original template string provided by the server for this step',
			readonly: true,
			visible: false,
		},
	},

	supportsStep(stepClass, templateData) {
		if (stepClass !== this.stepClass) {
			return false;
		}
		const hasMinBet = templateData.minbet !== '0';
		if (this.hasMinBet !== hasMinBet) {
			return false;
		}
		const hasBuyInID = templateData.slotname !== '';
		if (this.hasBuyInID !== hasBuyInID) {
			return false;
		}
		return true;
	},

	setupWithStep(stepClass, templateData) {
		this.stepClass = stepClass;
		this.hasBuyInID = templateData.slotname !== '';
		this.hasMinBet = templateData.minbet !== '0';
		this.defaultTemplateString = templateData.templateString;
		this.templateString = this.defaultTemplateString;
	},
});
