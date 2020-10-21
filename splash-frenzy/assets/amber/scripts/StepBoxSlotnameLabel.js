const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const StepBoxComponent = require('StepBoxComponent');


cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		requireComponent: DataTemplateRichTextLabel,
		executeInEditMode: true,
		menu: 'Slotname Label',
	},

	properties: {
		stepIdNode: {
			default: null,
            type: StepBoxComponent,
		},
		colorLock: '',
		colorCompleted: '',
	},

	_populateRTData: function(rtLabel) {
		let slotName = this.slotName;
		let color = this.activeColor;
		const data = {
			slotname: slotName,
			color: color,
		};

		rtLabel.setData(data);
		rtLabel.testData = JSON.stringify(data);
	},

	onUpdateMissionStepData: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
		let stepBoxComp = this.stepIdNode;
		const stepId = stepBoxComp.stepId;

		this.stepBoxData = stepBoxComp &&
			stepBoxComp.missionInterface &&
			stepBoxComp.missionInterface._stepData[stepId].data;

		if (this.stepBoxData) {
			let currentStepBuyInID = this.stepBoxData.buyInIDs[0];
			this.slotName = this._getSlotName(currentStepBuyInID);
			this.activeColor = stepBoxComp.stepStatus == 'locked' ? this.colorLock : this.colorCompleted;

			if (!rtLabel.templateString || rtLabel.templateString == '') {
				rtLabel.templateString = this.slotName;
			}
	
			this._populateRTData(rtLabel);
		}
	},

	_getSlotName: function(buyInID) {
		const slotData = buyInID && this.missionStepInterface.getSlotData(buyInID);
		return slotData && slotData.name;
	},
});