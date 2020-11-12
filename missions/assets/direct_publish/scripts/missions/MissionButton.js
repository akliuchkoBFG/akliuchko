const BaseMissionComponent = require('BaseMissionComponent');

const TAG = "MissionButton";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: cc.Button,
		executeInEditMode: true,
		// TODO: help: 'url/to/help/wikipage'
	},

	onLoad: function() {
		this._super();
		if (CC_EDITOR) {
			if (this._indexOfButtonAction() >= 0) {
				return;
			}
			
			// Automatically add the button action to the click events
			const button = this.getComponent(cc.Button);
			const clickEvent = new cc.Component.EventHandler();
			clickEvent.target = this.node;
			clickEvent.component = this.__classname__;
			clickEvent.handler = 'performMissionAction';
			button.clickEvents.push(clickEvent);
		}
	},

	destroy: function() {
		if (CC_EDITOR) {
			const actionIndex = this._indexOfButtonAction();
			if (actionIndex > -1) {
				const button = this.getComponent(cc.Button);
				button.clickEvents.splice(actionIndex, 1);
			}
		}
		this._super();
	},

	performMissionAction: function() {
		// Override with specific actions
	},

	// Helper Functions
	// ----------------------------------------------------------------------
	_indexOfButtonAction() {
		let foundIndex = -1;
		const button = this.getComponent(cc.Button);
		button.clickEvents.some((event, index) => {
			if (this._isMissionAction(event)) {
				foundIndex = index;
				return true;
			}
		});
		
		return foundIndex;
	},

	_isMissionAction(event) {
		return event.target === this.node && 
			   event.component === this.__classname__ && 
			   event.handler === 'performMissionAction';
	},
});
