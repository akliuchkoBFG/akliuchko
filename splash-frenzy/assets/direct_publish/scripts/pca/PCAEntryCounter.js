const PCABaseComponent = require('PCABaseComponent');
const RollupLabel = require('RollupLabel');
const EntryTextType = cc.Enum({
	"Total Entries":0,  	
	"Spins":1,				
	"Spins Per Entry":2,	
	"Spins Left": 3,    	
});

const EntryTextLoadDataKeys = [
	"weightedEntries",
	"numEntries",
	"spinsPerEntry",
	"spinsLeft",
];

cc.Class({
	extends: PCABaseComponent,
	editor: CC_EDITOR && {
		menu: 'Add PCA Component/Entry Counter',
		requireComponent: RollupLabel,
	},

	properties: {
		entryType:{
			default: EntryTextType['Spins'],
			type: EntryTextType, 
			tooltip: "This label will display X in these examples:\nTotal Entries: You've won X chests so far \n Spins: You've spun X times so far\n Spins Per Entry: Every X spins earns you a chest!\n Spins Left: Spin X more times to win another chest!",
		},
		spineAnimation: {
			default: null,
			type: sp.Skeleton,
		},
		activeAnimation: {
			default: 'active',
			tooltip: 'Animation to play when entries are rolling up',
			visible: function () {
				return this.spineAnimation;
			},
		},
		idleAnimation: {
			default: 'idle',
			tooltip: 'Idle Animation to play after poke animation (reset)',
			visible: function () {
				return this.spineAnimation;
			},
		},
	},

	onLoad: function() {
		this._loadData.spinsLeft = this._loadData.spinsPerEntry - this._loadData.numEntries;
		this._spinsPerEntry = this._loadData.spinsPerEntry;
		
		this._rollupLabel = this.getComponent('RollupLabel');
		this._rollupLabel.rollupValue = this.getAdjustedNumEntries();
	},

	start: function() {
		if (this.spineAnimation &&  this._loadData.numEntries) {
			this.spineAnimation.setAnimation(0, this.activeAnimation, false);
			this.spineAnimation.addAnimation(0, this.idleAnimation, true);
		}
	},
	getAdjustedNumEntries: function() {
		const dataKey = EntryTextLoadDataKeys[this.entryType];
		return this._loadData[dataKey];
	},
});
