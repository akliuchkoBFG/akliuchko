const TAG = "Utils";
const ComponentLog = require('ComponentSALog')(TAG);

/**
 * This file should be free from any dependansies and which means should not contain any imports axept logs...
 */
const Utils = cc.Class({
    mixins: [ComponentLog],
    extends: cc.Component,
    properties: {},
});

// Components use this to smartly search for interface classes in the node hierarchy
Utils.findComponentInScene = function(component, type = '') {

    let serchComponent = null;
    if (!type) return serchComponent;
	let node = component.node;
	
	while ((serchComponent === null || node === null) && !(node instanceof cc.Scene)) {
		serchComponent = node.getComponent(type);
		if (!serchComponent) {
			node = node.getParent();
		}
	}

	if (!serchComponent) {
         const text = `Required Component ${type} NOT FOUND in scene and must be added`;
         CC_EDITOR ? Editor.warn(text) : this.log.e(text);
	}

	return serchComponent;
};

Utils.getRandomArbitrary = function (value1, value2) {
    const min = Math.min(value1, value2);
    const max = Math.max(value1, value2);
    return Math.random() * (max - min) + min;
}
  
Utils.getRandomInt = function (value1, value2) {
    const min = Math.ceil(Math.min(value1, value2));
    const max = Math.floor(Math.max(value1, value2));
    return Math.floor(Math.random() * (max - min) + min);
}

module.exports = Utils;
