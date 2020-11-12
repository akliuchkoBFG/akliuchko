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

	onEnable: function () {
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

	_populateRTData: function (rtLabel) {
		let slotName = this.slotName;
		let color = this.activeColor;
		let type = this.stepType;
		let characterName = this.characterName;
		const data = {
			slotname: slotName,
			color: color,
			stepType: type,
			character: characterName,
		};

		rtLabel.setData(data);
		rtLabel.testData = JSON.stringify(data);
	},

	updateStepDescriptionLabel: function () {
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
			this.stepType = this.setStepInitailDescription(this.stepIdNode.stepSlotName);
			this.characterName = this.getCharacterName()

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

	_getSlotName: function (buyInID) {
		const slotData = buyInID && this.missionStepInterface.getSlotData(buyInID);
		return slotData && slotData.name;
	},

	setStepInitailDescription: function (type) {
		let value;
		switch (type) {
			case 'MissionStepWins':
			case 'MissionStepWinsThreshold':
				value = 'Win in';
				break;
			case 'MissionStepBet':
				value = 'Bet in';
				break;
			case 'MissionStepSpin':
				value = 'Spin in';
				break;
			case 'MissionStepBigWins':
				value = 'Big Win in';
				break;
			case 'MissionStepGiftGiving':
				value = 'Give Gift in';
				break;
			case 'MissionStepBingo':
				value = 'Mark Bingo in';
				break;
			default:
				value = 'Win in';
				break;
		}
		return value;
	},

	getCharacterName: function () {
		const characterComp = this.getComponent('StepMilestoneCharacters');
		if (characterComp) {
			let character = characterComp.getCharacters(characterComp.stepMilestone);
			return character && character.name ;
		}
	}
});