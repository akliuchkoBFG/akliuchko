const TAG = 'CreatorTableView';
const ComponentLog = require('ComponentSALog')(TAG);
const TableViewCell = require('TableViewCell');
const AutoSpaceLayout = require('AutoSpaceLayout');
const PrefabPool = require('PrefabPool');

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: {
		executeInEditMode: true,
	},

	properties: {
		cellTypes: {
			default: [],
			type: [cc.Prefab],
		},
		autoLayout: {
			displayName: "Auto Spacing",
			default: function() {
				const autoLayout = new AutoSpaceLayout();
				autoLayout._automaticCellSize = true;
				return autoLayout;
			},
			type: AutoSpaceLayout,
			tooltip: "(Optional) Provide the layout component used for this table view to allow the spacing parameters to be calculated automatically. Can only be used if all prefab cells are the same size.",
		},
		_poolingEnabled: {
			get: function() {
				// Disable prefab instance pooling in-editor
				return !CC_EDITOR;
			},
		},
	},

	onLoad() {
		this._initPrefabMaps();
		this.autoLayout.applySpacingToLayout();
		this.node.on('size-changed', this._onSizeChange, this);
	},

	_onSizeChange() {
		this.autoLayout.applySpacingToLayout();
	},

	_onCellSizeChange(evt) {
		const instance = evt.target;
		const container = instance.parent;
		if (container && this.node.children.indexOf(container) !== -1) {
			container.setContentSize(instance.getContentSize());
		}
	},

	// Lazy load prefab data structures and pools as needed
	_initPrefabMaps() {
		if (!this._prefabsByType || this._cellTypesDirty || CC_EDITOR) {
			this._cleanupPools();
			this._prefabsByType = {};
			this._poolsByUuid = {};
			this.cellTypes.forEach((prefab) => {
				if (!prefab) {
					return;
				}
				this._prefabsByType[prefab.name] = prefab;
				if (!prefab._uuid) {
					throw new Error(`Prefab ${prefab.name} requires a uuid to be properly displayed in a table view`, TAG);
				}
				if (this._poolingEnabled) {
					this._poolsByUuid[prefab._uuid] = new PrefabPool('TableViewCell', prefab);
				} else {
					this._poolsByUuid[prefab._uuid] = new PrefabPool.NullPool('TableViewCell', prefab);
				}
			});
			this._cellTypesDirty = false;
		}
	},

	// Editor only update check makes sure that autolayout parameters are only allowed if all cells are the same size
	update: CC_EDITOR && function updateInEditor() {
		if (!this.autoLayout.layout) {
			return;
		}
		for (let i = this.cellTypes.length - 1; i > -1; --i) {
			const prefabNode = this.cellTypes[i] && this.cellTypes[i].data;
			if (prefabNode) {
				if (!this.autoLayout.cellSize.equals(prefabNode._contentSize)) {
					if (this.autoLayout.cellSize.equals(cc.Size.ZERO)) {
						this.autoLayout.cellSize = prefabNode.getContentSize();
					} else {
						Editor.warn('TableView: Prefab cell sizes must be identical to use automatic layout spacing');
						this.autoLayout.layout = null;
						this.autoLayout.cellSize = cc.Size.ZERO;
						break;
					}
				}
			}
		}
	},

	setCellData(cellData) {
		this._initPrefabMaps();
		this._cellData = cellData;
		const cellCount = cellData.length;
		const nodeCount = this.node.children.length;
		for (let i = 0; i < cellCount; ++i) {
			const cellInfo = this._cellData[i];
			const cellContainer = this.node.children[i];
			this._createCell(cellInfo, cellContainer);
		}

		// Remove extra container nodes
		for (let i = nodeCount - 1; i >= cellCount; --i) {
			const cellContainer = this.node.children[i];
			this._clearSizeListener(cellContainer);
			cellContainer.children.forEach((child) => {
				this._recycle(child);
			});
			cellContainer.removeFromParent();
		}
	},

	addCell(cellInfo) {
		this._cellData.push(cellInfo);
		this._createCell(cellInfo);
	},

	getCellCount() {
		return this.node.children.length;
	},

	addCellPrefab(prefab) {
		if (!prefab._uuid) {
			throw new Error(`Prefab ${prefab.name} requires a uuid to be properly displayed in a table view`, TAG);
		}
		for (let i = this.cellTypes.length - 1; i > -1; --i) {
			const cellPrefab = this.cellTypes[i];
			if (cellPrefab._uuid === prefab._uuid){
				// Prefab already exists in cell types
				return;
			}
		}
		this.cellTypes.push(prefab);
		this._cellTypesDirty = true;
	},

	getCellTypes() {
		this._initPrefabMaps();
		return Object.keys(this._prefabsByType);
	},

	_createCell(cellInfo, cellContainer) {
		const prefab = this._prefabsByType[cellInfo.prefab];
		if (!prefab) {
			this.log.e(`No prefab found for name ${cellInfo.prefab}`, new Error().stack);
			return;
		}
		if (!cellContainer) {
			// Create a new container node
			cellContainer = new cc.Node();
			if (CC_EDITOR) {
				cellContainer.addComponent('EditorOnly');
				cellContainer.name = "preview";
			}
			this.node.addChild(cellContainer);
		} else {
			this._clearSizeListener(cellContainer);
			// Remove existing cell contents from container node
			cellContainer.children.forEach((child) => {
				this._recycle(child);
			});
		}
		cellContainer.setContentSize(prefab.data.getContentSize());
		cellContainer.setAnchorPoint(prefab.data.getAnchorPoint());
		const instance = this._getInstanceOfPrefab(prefab);
		cellContainer.addChild(instance);
		this._updateCellDataOnInstance(instance, cellInfo.data);
		// Allow table cells to change content size and update their containers
		instance.on('size-changed', this._onCellSizeChange, this);
	},

	_recycle(node) {
		if (!node) {
			return;
		}
		const prefabPool = this._poolsByUuid[node._poolID] || new PrefabPool.NullPool('TableViewCell');
		prefabPool.put(node);
	},

	_clearSizeListener(container) {
		if (!container) {
			return;
		}
		(container.children || []).forEach((instance) => {
			instance.off('size-changed', this._onCellSizeChange, this);
		});
	},

	_getInstanceOfPrefab(prefab) {
		const prefabPool = this._poolsByUuid[prefab._uuid];
		const instance = prefabPool.get();
		return instance;
	},

	_updateCellDataOnInstance(cell, data) {
		if (!cell || !data) {
			return;
		}
		const cellController = cell.getComponent(TableViewCell);
		if (cellController) {
			cellController.updateCellData(data);
		}
	},

	_cleanupPools() {
		if (!this._poolsByUuid) {
			return;
		}
		Object.keys(this._poolsByUuid).forEach((uuid) => {
			const pool = this._poolsByUuid[uuid];
			pool.destroy();
		});
	},

	onDestroy() {
		this.node.off('size-changed', this._onSizeChange, this);
		(this.node.children || []).forEach(this._clearSizeListener.bind(this));
		this._cleanupPools();
	},
});
