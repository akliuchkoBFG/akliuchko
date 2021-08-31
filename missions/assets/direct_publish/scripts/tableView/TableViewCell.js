cc.Class({
	extends: cc.Component,

	properties: {
	},

	// Called when a cell is created or pulled out of a pool for reuse
	reuse() {
	},

	// Called when a cell is removed from the table and put into a pool
	unuse() {
	},

	// Called when the data for a cell is provided by the table view
	updateCellData(data) {
	},
});
