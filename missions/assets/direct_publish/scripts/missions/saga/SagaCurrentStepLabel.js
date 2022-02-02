const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateLabel = require('DataTemplateLabel');
const SagaController = require('SagaController');

const TAG = "SagaCurrentStepLabel";
const ComponentLog = require('ComponentSALog')(TAG);


/* SagaStepCurrentLabel updates two DataRichTextLabels in the Saga mission that display
 * the current step and zone.
 */
cc.Class({
	extends: BaseMissionStepComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Saga/Zone Step Label',
		executeInEditMode: true,
		requireComponent: DataTemplateLabel,
	},

	properties: {
		sagaController: {
			type: SagaController,
			default: null,
		}
	},

	onLoad() {
		this._super();
		this._initialized = false;
		this.sagaController.on('saga.initialize-complete', this._initialize, this);
		this._initializeEditor();
	},

	_initializeEditor() {
		if (!CC_EDITOR) {
			return;
		}
		const label = this.getComponent('DataTemplateLabel');
		if (label && (label.testData === '' || label.testData === '{}')) {
			label.testData = JSON.stringify({
				currentStep: 1,
				zoneStepCount: 5,
				currentZoneIndex: 1,
				zoneCount: 4,
			}, null, '\t');
		}
	},

	_initialize() {
		this._initialized = true;
		this.onUpdateMissionStepData();
	},

	onUpdateMissionStepData() {
		if (this._initialized) {
			const templateLabel = this.getComponent('DataTemplateLabel');
			this.updateDataForTemplate(templateLabel);
		}
	},

	updateDataForTemplate(label) {
		const zoneData = this.sagaController.getZoneData();
		/*
			{
				currentStep,
				zoneStepCount,
				currentZoneIndex,
				zoneCount,
			}
		*/
		label.setData(zoneData);
	},
});
