// Disable linting for unused function args since this file contains abstract class definitions
/* eslint no-unused-vars: [1, {"args": "none"}] */
const TAG = "SagaZoneAsset";
const ComponentLog = require('ComponentSALog')(TAG);

const ZoneAssetEntry = cc.Class({
	name: "ZoneAssetEntry",
	properties: {
		zoneName: {
			default: '',
			tooltip: 'Name of the zone where this asset will be used',
		},
	},

	configureZoneAsset(sagaZoneAsset) {
		// Override
		throw new Error("Unimplemented abstract class function ZoneAssetEntry.configureZoneAsset");
	},

	hasAsset() {
		// Override
		throw new Error("Unimplemented abstract class function ZoneAssetEntry.hasAsset");
	},
});

// This is an abstract component base class, intended to be subclassed to implement specific asset types (Sprite, Spine)
cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],
	statics: {
		ZoneAssetEntry,
	},

	properties: () => ({
		sagaController: {
			default: null,
			type: require('SagaController'), // eslint-disable-line global-require
			editorOnly: true,
			tooltip: [
				'Editor helper to connect to the saga and setup the asset list with placeholders for all zones',
				'When provided, will create an asset entry for every zone currently configured for the saga',
			].join('\n'),
			notify() {
				if (this.sagaController) {
					this.initializeZones(this.sagaController);
					this.sagaController.addZoneAsset(this);
					this.validateZones(this.sagaController);
					this.sagaController = null;
				}
			},
		},
		// Intentionally omits ZoneAssetEntry list property, as those will be subclassed for each asset type
	}),

	onEnable() {
		if (this._pendingZone) {
			this.setupForZone(this._pendingZone);
			this._pendingZone = null;
		}
	},

	initializeZones(sagaController) {
		const zoneNames = sagaController.getZoneNames();
		zoneNames.forEach((zoneName) => {
			if (!this.getAssetForZone(zoneName)) {
				this.addAssetForZone(zoneName);
			}
		});
	},

	validateZones(sagaController) {
		if (!CC_EDITOR) {
			return;
		}
		const zoneNames = sagaController.getZoneNames();
		const missingZoneAssets = [];
		zoneNames.forEach((zoneName) => {
			const asset = this.getAssetForZone(zoneName);
			if (!asset) {
				// This shouldn't be possible if being called after initializeZones
				Editor.error('Missing asset entry for zone: ' + zoneName);
				return;
			}
			if (!asset.hasAsset()) {
				missingZoneAssets.push(zoneName);
			}
		});
		if (missingZoneAssets.length > 0) {
			Editor.log("Zone asset entries added, please configure assets for zone(s): " + missingZoneAssets.join(', '));
		} else {
			Editor.success("Zone asset entries configured for all zones currently in the saga!");
		}
	},

	setupForZone(zoneName) {
		if (this._currentZone === zoneName || (this._pendingZone && this._pendingZone === zoneName)) {
			return;
		}
		if (!this.enabled) {
			// Component currently disabled, save asset update as a pending change
			this._pendingZone = zoneName;
			return;
		}
		this._currentZone = zoneName;
		const asset = this.getAssetForZone(zoneName);
		if (!asset) {
			this.log.w(`Zone asset not found in ${this.node.name} for zone ${zoneName}`);
			return;
		}
		asset.configureZoneAsset(this);
	},

	addAssetForZone(zoneName) {
		// Override
		throw new Error("Unimplemented abstract class function SagaZoneAsset.addAssetForZone");
	},

	getAssetForZone(zoneName) {
		// Override
		throw new Error("Unimplemented abstract class function SagaZoneAsset.getAssetForZone");
	},
});
