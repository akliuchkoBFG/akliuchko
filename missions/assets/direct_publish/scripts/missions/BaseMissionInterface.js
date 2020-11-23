
// Base class for shared functionality in the mission and step interfaces

const TAG = "baseMissionInterface";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionInterface = cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog],

	properties: {
	},

	// use this for initialization
	onLoad: function () {

	},

	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});

// Components use this to smartly search for interface classes in the node hierarchy
BaseMissionInterface.findInterfaceInScene = function(component, type = 'BaseMissionInterface') {
	let node = component.node;
	let missionInterface = null;

	while ((missionInterface === null || node === null) && !(node instanceof cc.Scene)) {
		missionInterface = node.getComponent(type);
		if (!missionInterface) {
			node = node.getParent();
		}
	}

	if (!missionInterface) {
		if (CC_EDITOR) {
			Editor.warn("Required Mission Interface NOT FOUND in scene and must be added to access Mission data");
		} else {
			this.log.e("Required Mission Interface NOT FOUND in scene and must be added to access Mission data");
		}
	}
	return missionInterface;
};


module.exports = BaseMissionInterface;


