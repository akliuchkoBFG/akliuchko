// Class for previewing a table view in the editor with empty prefab layouts
cc.Class({
	extends: cc.Component,

	editor: CC_EDITOR && {
		executeInEditMode: true,
	},

	properties: {
		previewString: {
			default: "0,1,2,3,4,0,1,2,3,4,0,1,2,3,4,0,1,2,3,4",
			tooltip: "Comma-separated string of cell types to preview, in the order they will be added to the table view",
			notify() {
				if (!this.enabled) {
					return;
				}
				this._setCellDataFromPreviewString();
			},
		},
	},

	onLoad() {
		this._objFlags |= cc.Object.Flags.EditorOnly;
		this._tableView = this.getComponent('TableView');
		this._ipc = new Editor.IpcListener();
		this._ipc.on('asset-db:asset-changed', this._onAssetChanged.bind(this));
		this._checkLastModifiedPrefab();
	},

	onEnable() {
		this._setCellDataFromPreviewString();
		// Refresh automatic layout parameters when toggling this preview component
		// This is here as a cheap workaround for the autolayout properties not immediately adjusting layout parameters in editor
		this._tableView.autoLayout.applySpacingToLayout();
	},

	onDisable() {
		// Clear out the preview data when disabling or removing this component
		this._setCellDataWithIndices([]);
	},

	onDestroy() {
		this._ipc.clear();
	},

	_checkLastModifiedPrefab() {
		Editor.Ipc.sendToMain('self-aware-components:last-modified-prefab', (err, uuid) => {
			if (uuid) {
				this._checkCellPrefabs(uuid);
			}
		});
	},

	_onAssetChanged(evt, asset) {
		if (!asset || asset.type !== 'prefab' || !asset.uuid) {
			return;
		}
		const uuid = asset.uuid;
		// Small delay to allow the prefab to fully load
		setTimeout(this._checkCellPrefabs.bind(this, uuid), 100);
	},

	_checkCellPrefabs(uuid) {
		const prefabRefreshPromises = [];
		this._tableView.cellTypes.forEach((cellPrefab, index) => {
			if (cellPrefab._uuid === uuid) {
				const refresh = new Promise((resolve) => {
					cc.AssetLibrary.loadAsset(uuid, (err, updatedPrefab) => {
						if (updatedPrefab instanceof cc.Prefab) {
							this._tableView.cellTypes[index] = updatedPrefab;
						}
						resolve();
					});
				});
				prefabRefreshPromises.push(refresh);
			}
		});

		if (prefabRefreshPromises.length > 0) {
			Promise.all(prefabRefreshPromises)
			.then(() => {
				if (!this.enabled) {
					return;
				}
				// Force a preview update after all prefabs have been reloaded
				setTimeout(this._setCellDataFromPreviewString.bind(this), 500);
			});
		}
	},

	_setCellDataFromPreviewString() {
		try {
			const tableViewIndices = this.previewString.split(',')
			.map((index) => {
				return +index || 0;
			});
			this._setCellDataWithIndices(tableViewIndices);
		} catch(e) {
			console.error(e);
			Editor.error("Table view preview failed to populate with fake data, please see an engineer to resolve this problem");
		}
	},

	_setCellDataWithIndices(cellTypeIndices = []) {
		const cellTypes = this._tableView.getCellTypes();
		const cellData = cellTypeIndices.map((typeIndex) => {
			const cellType = cellTypes[typeIndex % cellTypes.length];
			return {
				prefab: cellType,
			};
		});
		this._tableView.setCellData(cellData);
	},
});
