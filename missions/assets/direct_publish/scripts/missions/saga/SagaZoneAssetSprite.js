const TAG = "SagaZoneAssetSprite";
const ComponentLog = require('ComponentSALog')(TAG);

const SagaZoneAsset = require('SagaZoneAsset');

const ZoneAssetEntrySprite = cc.Class({
	extends: SagaZoneAsset.ZoneAssetEntry,
	name: "ZoneAssetEntrySprite",
	properties: {
		sprite: {
			default: null,
			type: cc.SpriteFrame,
			tooltip: "Sprite frame for this zone",
		},
	},

	configureZoneAsset(sagaZoneAsset) {
		const sprite = sagaZoneAsset.getComponent(cc.Sprite);
		sprite.spriteFrame = this.sprite;
	},

	hasAsset() {
		return this.sprite !== null;
	},
});

cc.Class({
	extends: SagaZoneAsset,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		requireComponent: cc.Sprite,
		menu: 'Add Mission Component/Saga/Zone Assset – Sprite',
	},

	properties: () => ({
		zoneAssets: {
			default: [],
			type: [ZoneAssetEntrySprite],
			tooltip: "List of assets for each zone",
		},
	}),

	addAssetForZone(zoneName) {
		const zoneAsset = new ZoneAssetEntrySprite();
		zoneAsset.zoneName = zoneName;
		this.zoneAssets.push(zoneAsset);
	},

	getAssetForZone(zoneName) {
		for (let i = 0; i < this.zoneAssets.length; i++) {
			const zoneAsset = this.zoneAssets[i];
			if (zoneAsset.zoneName === zoneName) {
				return zoneAsset;
			}
		}

		return null;
	},
});
