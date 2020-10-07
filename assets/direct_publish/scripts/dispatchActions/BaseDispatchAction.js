/* global
	SADispatchObject
	_
*/

// Class for implementing a common interface for performing an SAKit dispatch action from an action name
// and an optional data object
// Subclasses define the actual action name and data properties that define the action that gets performed
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		executeInEditMode: true,
		requireComponent: cc.Button,
	},

	properties: {
		_actionName:'',
		_dataPropertyKeys: {
			default: [],
			type: ['String'],
			tooltip: 'Property keys to use for the data object when launching the dispatch action, defined in onLoad of subclasses',
		},
	},

	onLoad: CC_EDITOR ? function onLoad() {
		if (!this._actionName) {
			cc.error("Dispatch action is missing an action name, check your code and define the _actionName property on the derived component");
			return;
		}
		const hasAction = this._indexOfButtonAction() > -1;
		const button = this.getComponent(cc.Button);
		// Automatically add the button action to the click events
		if (!hasAction) {
			const clickEvent = new cc.Component.EventHandler();
			clickEvent.target = this.node;
			clickEvent.component = this.__classname__;
			clickEvent.handler = 'performAction';
			button.clickEvents.push(clickEvent);
		}
	} : function() {},

	destroy: CC_EDITOR && function destroy() {
		const actionIndex = this._indexOfButtonAction();
		if (actionIndex > -1) {
			const button = this.getComponent(cc.Button);
			button.clickEvents.splice(actionIndex, 1);
		}
		this._super();
	},

	_indexOfButtonAction() {
		let foundIndex = -1;
		const button = this.getComponent(cc.Button);
		for (let i = 0; i < button.clickEvents.length; i++) {
			const clickEvent = button.clickEvents[i];
			if (clickEvent.target === this.node
					&& clickEvent.component === this.__classname__
					&& clickEvent.handler === 'performAction') {
				foundIndex = i;
				break;
			}
		}
		return foundIndex;
	},

	getDataObject() {
		let dataObj = null;
		if (this._dataPropertyKeys.length > 0) {
			dataObj = _.pick(this, this._dataPropertyKeys);
		}
		return dataObj;
	},

	performAction() {
		if (this._actionName) {
			SADispatchObject.performAction(this._actionName, this.getDataObject());
		}
	},
});
