/* global
	cc
*/

module.exports = {
	getUuidsFromProperties(object, uuidList) {
		if (object instanceof cc.RawAsset) {
			uuidList.add(object._uuid);
			// For cc.SpriteFrame also add the texture uuid
			if (object._texture instanceof cc.RawAsset) {
				uuidList.add(object._texture._uuid);
			}
			return;
		} else if (!(object instanceof cc.Class || object instanceof cc.Component)) {
			return;
		}
		const propNames = Object.getOwnPropertyNames(object);
		for (let i = 0; i < propNames.length; i++) {
			const property = object[propNames[i]];
			if (property instanceof cc.RawAsset) {
				this.getUuidsFromProperties(property, uuidList);
			} else if (property instanceof cc.Class) {
				// Recurse through cc.Class definitions looking for raw assets in property groups
				this.getUuidsFromProperties(property, uuidList);
			} else if (Array.isArray(property)) {
				for (let j = 0; j < property.length; j++) {
					this.getUuidsFromProperties(property[j], uuidList);
				}
			}
		}
	},

	getUuidsFromComponent(component, uuidList) {
		if (!(component instanceof cc.Component)) {
			return;
		}
		if (component.__scriptUuid) {
			uuidList.add(component.__scriptUuid);
		}
		this.getUuidsFromProperties(component, uuidList);
		// TODO: include an option here for adding to this list for assets referenced that might not be properties
	},

	getUuidsFromSceneGraph(node, uuidList) {
		if (!(node instanceof cc.Node)) {
			return;
		}
		if (!(uuidList instanceof Set)) {
			uuidList = new Set();
		}
		const components = node.getComponents(cc.Component);
		for (let i = 0; i < components.length; i++) {
			this.getUuidsFromComponent(components[i], uuidList);
		}
		const children = node.getChildren();
		for (let i = 0; i < children.length; i++) {
			this.getUuidsFromSceneGraph(children[i], uuidList);
		}
		return uuidList;
	},
};