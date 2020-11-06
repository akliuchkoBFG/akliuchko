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

	onEnable: function() {
        const stepBoxComp = this.stepIdNode;
        if (stepBoxComp) {
            this.updateStepDescriptionLabel();
        }
	},

	update: function () {
        if (this.stepIdNode && this.iconStatus !== this.stepIdNode.stepStatus) {
            this.updateStepDescriptionLabel();
        }
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

	updateStepDescriptionLabel: function() {
		let rtLabel = this.getComponent('DataTemplateRichTextLabel');
		let stepBoxComp = this.stepIdNode;
		const stepId = stepBoxComp.stepId;

		this.stepBoxData = stepBoxComp &&
			stepBoxComp.missionInterface &&
			stepBoxComp.missionInterface._stepData[stepId].data;

		if (this.stepBoxData) {
			const currentStepBuyInID = this._getStepBuyinId(this.stepBoxData);
			this.slotName = this._getSlotName(currentStepBuyInID);
			this.activeColor = stepBoxComp.stepStatus == 'locked' ? this.colorLock : this.colorCompleted;

			if (!rtLabel.templateString || rtLabel.templateString == '') {
				rtLabel.templateString = this.slotName;
			}
	
			this._populateRTData(rtLabel);
		}
	},

	_getStepBuyinId: function (stepData) {
		let firstBuyInID = '';
		const slotsData = this.missionStepInterface &&
						this.missionStepInterface.missionInterface &&
						this.missionStepInterface.missionInterface._missionData &&
						this.missionStepInterface.missionInterface._missionData.slotsData;
		if (stepData.hasOwnProperty('buyInIDs')) {
			firstBuyInID = stepData.buyInIDs[0];
		} else if (slotsData) {
			// get the fist buyInID from Slotsdata if there are no buyInID's in step;
			const slot = slotsData[Object.keys(slotsData)[0]];
			firstBuyInID = slot.customData.buyInID;
		}
		return firstBuyInID;
	},

	_getSlotName: function(buyInID) {
		const slotData = buyInID && this.missionStepInterface.getSlotData(buyInID);
		return slotData && slotData.name;
	},
});