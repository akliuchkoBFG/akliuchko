const LoadData = require('LoadDataV2')
.mixinProperty({
	numEntries: 0,
	entryWeight: 0,
	entryPayout: "",
	overrideForPreview: true,
});


cc.Class({
	extends: cc.Component,
	mixins: [LoadData],

	properties: {
		previewTotalEntries: {
			default: 10,
			tooltip: 'Number of individual entries (i.e. total spins)',
		},
		previewEntryWeight: {
			default: 1,
			tooltip: 'Number of entries required (i.e. spins required to be entered in the drawing)',
		},
		previewFreeSpinsImage: {
			default: '',
			tooltip: 'Free Spins hero image',
		},
		previewFreeSpinsCopy: {
			default: 'Buy these free spins!',
			tooltip: 'Hero copy, sits alongside the hero image',
		},
		previewProductPackageCopy: {
			default: 'And more!',
			tooltip: 'Body copy',
		},
		logStats: {
			default: true,
			tooltip: 'Log stats for popup viewed, pokeable clicked, exit clicked, and cta clicked',
		},
	},

	onLoad: function () {
		if(this.loadData.overrideForPreview){
			this.loadData.numEntries = this.previewTotalEntries;
			this.loadData.entryWeight = this.previewEntryWeight;

			this.loadData.freeSpinsImage     = this.previewFreeSpinsImage;
			this.loadData.freeSpinsCopy      = this.previewFreeSpinsCopy;
			this.loadData.productPackageCopy = this.previewProductPackageCopy;
		}

		var pcaComponents = this.node.getComponentsInChildren('PCABaseComponent');
		_.forEach(pcaComponents, function(component) {
			component.setLoadData(this.loadData);
		}, this);
		
		if (this.logStats) {
			this._logStat('viewed');
			this._addLogClickEvents('DispatchActionClose');
			this._addLogClickEvents('DispatchActionLaunchSlots', 'theme2_1');
			this._addLogClickEvents('Pokeable', 'spineAnimation.name');
		}
	},

	onPokeableClick: function(evt, customData) {
		var statName = customData ? customData + 'Clicked' : 'pokeableClicked';
		this._logStat(statName);
	},

	onDispatchActionCloseClick: function() {
		this._logStat('exitClick');
	},

	onDispatchActionLaunchSlotsClick: function(evt, customData) {
		var statName = customData ? customData + 'Clicked' : 'launchSlotsClick';
		this._logStat(statName);
	},

	_logStat: function(stat) {
		if (this.loadData.directPublishPromotionID) {
			SAMetrics.sendRollupStat(['pcaPopup', this.loadData.directPublishPromotionID, stat], 1);
		}
	},

	_addLogClickEvents: function(action, customDataProperty) {
		var clickComponents = this.node.getComponentsInChildren(action);
		_.forEach(clickComponents, function(component) {
			var button = component.node.getComponent(cc.Button);
			
			const clickEvent = new cc.Component.EventHandler();
			clickEvent.target = this.node;
			clickEvent.component = this.__classname__;
			clickEvent.handler = 'on' + action + 'Click';
			if (customDataProperty) {
				clickEvent.customEventData = this._getObjectValue(component, customDataProperty);
			} 

			button.clickEvents.push(clickEvent);
		}, this);
	},

	_getObjectValue: function(object, path, defaultValue = '') {
		path = path.split('.');
		return path.reduce((acc, curVal) => (acc && acc[curVal] ? acc[curVal] : defaultValue), object);
	},

});
