// TODO: This component could benefit from something that sets preview load data
//  for a range of productPackageItemData formats
const LoadData = require('LoadDataV2')
.mixinExpectedProperties(['productPackageItemData']);

// A basic label component for displaying product package information sent to a popup

cc.Class({
	extends: cc.Component,
	mixins: [LoadData],

	editor: {
		menu: 'Labels/Product Package Label',
		disallowMultiple: true,
		requireComponent: cc.Label,
	},

	// use this for initialization
	onLoad: function () {
		this._label = this.getComponent(cc.Label);
	},

	start: function() {
		if (this.loadData.productPackageItemData) {
			this._formatDescriptions();
		} else {
			SALog.e("Expected Product Package Data not Found");
		}
	},

	_formatDescriptions() {
		this._label.string = "";
		let items = 0;
		_.forEach(this.loadData.productPackageItemData, (itemData) => {
			if (itemData.name === 'Chips' && itemData.amount === 0) {
				return;
			}

			if (items > 0) {
				this._label.string += "\n+\n";
			}
			this._label.string += this._formatItemDescription(itemData);
			++items;
		});
	},

	_formatItemDescription(itemData) {
		switch(itemData.name) {
			case 'Chips': return SAStringUtil.numberAsShortString(itemData.amount) + (Game.isSlotzilla() ? ' COINS!' : ' CHIPS!');
			case 'Gold': return SAStringUtil.numberAsShortString(itemData.amount) + ' Gold!';
			case 'Boost': return (itemData.duration / 60) + " Minute " + itemData.boostConfig.multiplier + "x " + itemData.boostConfig.displayName;
			case 'Free Spins': return itemData.amount + " Free Spins for " + itemData.slotMachine;
			case 'Collection Chest': return itemData.amount + " " + itemData.chestName + " Chest" + ((itemData.amount > 1) ? "s!" : "!");
		}

		return "Not Supported : " + itemData.type;
	},
});
