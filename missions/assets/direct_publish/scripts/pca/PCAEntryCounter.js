const PCABaseComponent = require('PCABaseComponent');
const RollupLabel = require('RollupLabel');
const EntryTextType = cc.Enum({
	TotalEntries: 	0,
	Spins: 			1,
	SpinsPerEntry: 	2,
	SpinsLeft: 		3,
});


cc.Class({
	extends: PCABaseComponent,
	editor: CC_EDITOR && {
		menu: 'Marketing/PCA/Entry Counter',
		requireComponent: RollupLabel,
	},

	properties: {
		entryType:{
			default: EntryTextType.TotalEntries,
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
		this._rollupLabel = this.getComponent('RollupLabel');
		this._rollupLabel.rollupValue = this.getCalculatedAmount();
	},

	start: function() {
		if (this.spineAnimation && this.getCalculatedAmount()) {
			this.spineAnimation.setAnimation(0, this.activeAnimation, false);
			this.spineAnimation.addAnimation(0, this.idleAnimation, true);
		}
	},

	getCalculatedAmount: function() {
		switch (this.entryType) {
			case EntryTextType.TotalEntries:
				if (this._loadData.entryWeight) {
					return Math.floor(this._loadData.numEntries / this._loadData.entryWeight);
				}
				break;
			case EntryTextType.Spins:
				return this._loadData.numEntries;
				break;
			case EntryTextType.SpinsPerEntry:
				return this._loadData.entryWeight;
				break;
			case EntryTextType.SpinsLeft:
				return this._loadData.entryWeight - (this._loadData.numEntries % this._loadData.entryWeight);
				break;
		}
		return -1;
	},
});
