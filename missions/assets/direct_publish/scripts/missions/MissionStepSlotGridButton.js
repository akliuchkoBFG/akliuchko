const BaseMissionStepComponent = require('BaseMissionStepComponent');
const GridButtonLoader = require('GridButtonLoader');

const TAG = "MissionSlotGridButton";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: BaseMissionStepComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: GridButtonLoader,
	},

	properties: {
		index: {
			default: 0,
			tootip: "Set the index of the buyInID to use if multiple are specified"
		},
	},

	onLoad: function() {
		this._super();
		this._loadingPromise = null;
	},

	start: function() {
		
	},

	destroy: function() {
		this._super();
	},

	onUpdateMissionStepData: function() {
		// Grid buttons can only be loaded in game
		if (!CC_EDITOR) {
			const gridButtonData = this._getGridButtonData();
			if (gridButtonData && (!this._loadingPromise || this._loadingPromise.isResolved())) {
				const loader = this.getComponent(GridButtonLoader);
				this._loadingPromise = loader.loadGridButton(gridButtonData);
			}
		}
	},

	_getGridButtonData: function() {
		const buyInIDs = this.missionStepInterface.getBuyInIDs();
		if (this.index < buyInIDs.length) {
			const slotData = this.missionStepInterface.getSlotData(buyInIDs[this.index]);
			if (slotData) {
				return slotData.gridButtonData;
			}
		} else {
			this.log.w("No buyInID found at index " + this.index);
		}
		return null;
	},
});
