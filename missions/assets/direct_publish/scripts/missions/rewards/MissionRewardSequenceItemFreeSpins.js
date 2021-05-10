const TAG = "MissionRewardSequenceItemFreeSpins";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardSequenceItem = require('MissionRewardSequenceItem');
const GridButtonLoader = require('GridButtonLoader');
const MissionRewardFilterPremiumItemType = require('MissionRewardFilterPremiumItemType');
const DataTemplateLabel = require('DataTemplateLabel');
const EditorButtonProperty = require('EditorButtonProperty');

cc.Class({
	extends: MissionRewardSequenceItem,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Sequence/Sequence Item Free Spins',
		executeInEditMode: true,
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		gridButton: {
			default: null,
			type: GridButtonLoader,
			tooltip: "(Optional) hook up for loading a grid button image for this reward type",
		},
		_filter: {
			default: null,
			type: MissionRewardFilterPremiumItemType,
			tooltip: "Required reward filter to use this item type",
			displayName: "Reward Filter",
			visible() {
				return !this._filter;
			},
			notify() {
				if (!this._filter) {
					return;
				}
				this._filter.setItemType('freeSpins');
			},
		},
		templateLabels: {
			default: [],
			type: [DataTemplateLabel],
			tooltip: [
				'Template Labels or RichTexts that receive free spins data',
				'Data keys: amount, bet_value, bet_value_short, bet_value_format, slot_name',
			].join('\n'),
		},
		// Button for initializing/resetting template labels
		resetLabels: {
			default: function() {
				return new EditorButtonProperty('Reset Labels');
			},
			serializable: false,
			type: EditorButtonProperty,
			tooltip: 'Initialize or reset labels to default template string values with valid editor preview data',
		},
	},

	__preload() {
		if (!this._filter) {
			if (CC_EDITOR) {
				Editor.log("Automatically adding required reward filter for free spins component");
			}
			this._filter = this.addComponent(MissionRewardFilterPremiumItemType);
		}
		if (CC_EDITOR) {
			this.resetLabels.action = this._resetLabelsToDefault.bind(this);
		}
	},

	setReward(itemData, premiumItemModel) {
		this._super(itemData, premiumItemModel);
		if (this.gridButton) {
			const gridButtonLoad = this.gridButton
				.loadGridButton(premiumItemModel.get('gridButton'))
				.catch(() => {});
			this._loadingPromise = Promise.all([this._loadingPromise, gridButtonLoad]);
		}
		this._setupLabels(premiumItemModel);
	},

	_setupLabels(itemModel) {
		const betValue = itemModel.get('betValue');
		const templateData = {
			amount: itemModel.get('count'),
			bet_value: betValue,
			bet_value_short: SAStringUtil.numberAsShortString(betValue),
			bet_value_format: SAStringUtil.formatNumber(betValue),
			slot_name: itemModel.get('slotMachine'),
		};
		this.templateLabels.forEach((templateLabel) => {
			templateLabel.setData(templateData);
		});
	},

	_resetLabelsToDefault() {
		const DEFAULT_TEMPLATE_STRING = "{amount} Free Spins at {slot_name} ({bet_value_short} bet)";
		const betValue = 1000000;
		const templateData = {
			amount: 5,
			bet_value: betValue,
			bet_value_short: SAStringUtil.numberAsShortString(betValue),
			bet_value_format: SAStringUtil.formatNumber(betValue),
			slot_name: 'Jackpot City Deluxe VIP',
		};
		const json = JSON.stringify(templateData, null, '\t');
		this.templateLabels.forEach((templateLabel) => {
			templateLabel.testData = json;
			templateLabel.templateString = DEFAULT_TEMPLATE_STRING;
			templateLabel.setData(templateData);
		});
	}
});
