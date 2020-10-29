
// Base class for shared functionality in the mission and step interfaces

const BaseMissionInterface = cc.Class({
	extends: cc.Component,

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
BaseMissionInterface.findInterfaceInScene = function(component) {
	let node = component.node;
	let missionInterface = null;
	if (CC_EDITOR) {
		while ((missionInterface === null || node === null) && !(node instanceof cc.Scene)) {
			missionInterface = node.getComponent(this.name);
			if (!missionInterface) {
				node = node.getParent();
			}
		}

		if (!missionInterface) {
			Editor.error("Required Mission Interface NOT FOUND in scene and must be added to access Mission data");
		}
	}
	return missionInterface;
};


module.exports = BaseMissionInterface;


