
const TAG = "MissionUserSelection";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');

cc.Class({
	extends: BaseMissionComponent,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/User Selection/User Selection',
	},

	properties: {
		dataKey: {
			default: "default_key",
			tooltip: "Data is stored as key:value pair, this is the KEY for this selection.",
		},

		checkbox: {
			default: null,
			type: cc.Node,
			tooltip: "Enables and moves checkbox over user last user selection.",
		},

		items: {
			default: [],
			type: [cc.Button],
			tooltip: "Selectable options.  A click event with be added dynamicaly for each item selection"
		},
	},

	// use this for initialization
	onLoad: function () {
		this._super();
		this._currentSelection = null;
		this._madeSelection = false;

		if (!CC_EDITOR) {
			this._addButtonEvent();
		}
	},

	onUpdateMissionData: function() {
		// do we need to do anything here?
	},

	setSelection: function(selectedItem) {
		this._repositionCheckbox(selectedItem.currentTarget);
		this.missionInterface.updatePublicCommandData({[this.dataKey]: selectedItem.currentTarget.getName() }, true);
	},

	_addButtonEvent: function() {
		const clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = this.node;
        clickEventHandler.component = TAG;
        clickEventHandler.handler = "setSelection";
        clickEventHandler.customEventData = "";

		for (var itemIndex = 0; itemIndex < this.items.length; itemIndex++) {
			this.items[itemIndex].getComponent('cc.Button').clickEvents.push(clickEventHandler);
		}
	},

	_repositionCheckbox: function (target) {
		if (!this.checkbox) {
			// The selection made will be reflected in the final outcome compilation so this is purely optional
			return;
		}

		this.checkbox.setPosition(target.getPosition());
		this.checkbox.active = true;
	}

});
