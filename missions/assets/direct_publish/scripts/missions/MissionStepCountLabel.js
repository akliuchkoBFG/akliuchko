// Basic Component for displaying the active step ID and total number of steps

const BaseMissionComponent = require('BaseMissionComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');

cc.Class({
	extends: BaseMissionComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Add Mission Component/Step Count Label',
	},

	properties: {
		showNumCompleted: {
			default: false,
			tooltip: "Setting this to true will show num steps completed instead of the active step"
		}
	},

	onUpdateMissionData: function() {
		const rtLabel = this.getComponent('DataTemplateRichTextLabel');
		if (!rtLabel.templateString || rtLabel.templateString == '') {
			rtLabel.templateString = '{count} / {max}';
		}
		this._populateRTData(rtLabel);
	},

	_populateRTData: function(rtLabel) {
		let count = this.showNumCompleted ? 0 : 1;
		let max = 0;

		const steps = this.missionInterface._stepData;
		_(steps).forOwn((step, id) => {
			if (step.data) {
				if (step.data.awarded) {
					++count;
				}
				++max;
			}
		});
		const data = {count: count, max: max};
		rtLabel.setData(data);

		// Set the editor mode properties
		rtLabel.testData = JSON.stringify(data, null, '\t');
	}
});
