
// Behavior that mimics prefab pooling without doing actual pooling
const NullPrefabPool = cc.Class({
	name: "NullPrefabPool", 
	ctor() {
		this.poolHandlerComp = arguments[0];
		this.prefab = arguments[1];
	},
	get() {
		const node = cc.instantiate(this.prefab);
		node._poolID = this.prefab._uuid;
		const handler = this.poolHandlerComp ? node.getComponent(this.poolHandlerComp) : null;
		if (handler && handler.reuse) {
			handler.reuse.apply(handler, arguments);
		}
		return node;
	},
	put(node) {
		const handler = this.poolHandlerComp ? node.getComponent(this.poolHandlerComp) : null;
		if (handler && handler.unuse) {
			handler.unuse.apply(handler, arguments);
		}
		node.removeFromParent();
	},

	destroy() {},
});

const PrefabPool = cc.Class({
	name: "PrefabPool",
	extends: cc.NodePool,

	properties: {
		_prefab: {
			default: null,
			type: cc.Prefab,
		},
		prefab: {
			type: cc.Prefab,
			get() {
				return this._prefab;
			},
			set(prefab) {
				if (prefab === this._prefab) {
					return;
				}
				// Reset pool
				this.clear();
				this._poolID = prefab._uuid;
				this._prefab = prefab;
			}
		},
	},

	statics: {
		NullPool: NullPrefabPool,
	},

	ctor() {
		// Parent class uses arguments[0] for this.poolHandlerComp
		const prefab = arguments[1];
		if (!(prefab instanceof cc.Prefab)) {
			console.warn("Second argument to PrefabPool constructor should be a prefab");
		}
		this.prefab = prefab;
	},

	get() {
		let node = this._super();
		// Pool is empty, 
		if (!node) {
			const prefab = this.prefab;
			if (!(prefab instanceof cc.Prefab)) {
				throw new Error("PrefabPool does not have a valid prefab");
			}
			node = cc.instantiate(prefab);
			node._poolID = this._poolID;
			const handler = this.poolHandlerComp ? node.getComponent(this.poolHandlerComp) : null;
			if (handler && handler.reuse) {
				handler.reuse.apply(handler, arguments);
			}
		}
		return node;
	},

	put(node) {
		if (!node) {
			return;
		}
		if (node._poolID === this._poolID) {
			this._super(node);
		} else {
			// Trying to put a node in the pool that doesn't match the current prefab
			// Remove to remain consistent with normal 'put' behavior, but don't add it to the pool
			node.removeFromParent();
		}
	},

	destroy() {
		this.clear();
	},
});

module.exports = PrefabPool;
