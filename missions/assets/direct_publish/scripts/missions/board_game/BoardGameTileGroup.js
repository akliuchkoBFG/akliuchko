const TAG = "BoardGameTileGroup";
const ComponentLog = require('ComponentSALog')(TAG);

const BoardGameTile = require('BoardGameTile');

const BoardGameTileGroup = cc.Class({
	name: 'BoardGameTileGroup',

	mixins: [ComponentLog],
	properties: {
		stepID: {
			default: 0,
		},
		tiles: {
			default: [],
			type: BoardGameTile,
		},
		// List of random numbers used to determine order of the lootboxes within this step group
		_shuffleOrder: [],
	},

	setStepData(stepData) {
		this.stepID = stepData.data.id;
		this._stepData = _.cloneDeep(stepData);
		// Append award result information to each individual product package award
		const indexByClass = _.mapValues(this._stepData.data.award, () => { return 0; });
		this._stepData.data.awardResult.forEach((awardResult) => {
			const className = awardResult.class;
			const currentIndex = indexByClass[className]++;
			this._stepData.data.award[className][currentIndex].awardResult = awardResult;
		});
	},

	setShuffleOrder(shuffleOrder) {
		this._shuffleOrder = shuffleOrder;
	},

	_getLootboxPackage() {
		const award = this._stepData.data.award;
		if (!award || !award.ProductPackageItemLootBox) {
			// TODO is this an error?
			this.log.d("No lootbox in product package");
			return null;
		}
		const lootboxes = _.sortBy(award.ProductPackageItemLootBox, 'order');
		if (lootboxes.length > 1) {
			this.log.e("More than one lootbox is undefined behavior, using first one");
		}
		const lootbox = lootboxes[0];
		// Add original data index to retain ordering information if the lootbox is shuffled
		lootbox.lootbox.forEach((productPackage, index) => {
			productPackage.lootboxIndex = index;
		});
		return lootbox;
	},

	claimTiles(availableTiles) {
		if (!this._stepData) {
			throw new Error(`[${TAG}] Cannot claim tiles without step data`);
		}
		const lootbox = this._getLootboxPackage();
		if (lootbox) {
			// Award contains a lootbox, use individual lootbox product packages as tiles
			// Predicatable shuffle: sort using random but consistent ordering from _shuffleOrder
			const lootboxPackages = _.sortBy(lootbox.lootbox, (productPackage, index) => {
				return this._shuffleOrder[index] || 0;
			});
			const productPackagesByID = lootbox.promoData.lootbox;
			lootboxPackages.forEach((lootboxPackage) => {
				if (availableTiles.length < 1) {
					throw new Error(`[${TAG}] Unable to configure scene for mission data, not enough tiles to support mission structure`);
				}
				const productPackage = productPackagesByID[lootboxPackage.productPackageID];
				const tile = availableTiles.shift();
				tile.setProductPackage(productPackage, lootboxPackage.lootboxIndex);
				this.tiles.push(tile);
			});
		} else {
			// Consider throwing here?
			// Board game might be simpler overall if all packages are lootboxes even if they are single items
			this.log.d("Non-lootbox reward, using a single tile to display the product package");
			if (availableTiles.length < 1) {
				throw new Error(`[${TAG}] Unable to configure scene for mission data, not enough tiles to support mission structure`);
			}
			const award = this._stepData.data.award;
			const tile = availableTiles.shift();
			// When no lootbox is present, assume that previewing the actual result on a single tile is acceptable
			tile.setProductPackage(award, 0);
			this.tiles.push(tile);
		}
		// Hide tiles that have already been claimed by initialization time
		try {
			const awardedTile = this.getAwardTile();
			awardedTile.markRewardClaimed();
		} catch(e) {
			// No reward tile yet, nothing to mark claimed
		}
		return availableTiles;
	},

	getTileByLootboxIndex(lootboxIndex) {
		for (let i = this.tiles.length - 1; i >= 0; i--) {
			const tile = this.tiles[i];
			if (tile.getLootboxIndex() === lootboxIndex) {
				return tile;
			}
		}
		throw new Error("Tile not found for index: " + lootboxIndex);
	},

	getAwardTile() {
		if (!this._stepData) {
			throw new Error(`[${TAG}] Cannot get award tile without step data`);
		} else if (_.isEmpty(this._stepData.data.awardResult)) {
			throw new Error(`[${TAG}] Cannot get award tile, award not yet claimed`);
		}
		const lootbox = this._getLootboxPackage();
		if (!lootbox) {
			// Static award, no lootbox
			return this.tiles[0];
		}
		const lootboxIndex = lootbox.awardResult.result.productPackageIndex;
		return this.getTileByLootboxIndex(lootboxIndex);
	},
});
module.exports = BoardGameTileGroup;
