var MissionPopupController = require("MissionPopupController");
var progressPopupsComponent = {};

cc.Class({
    extends: cc.Component,
    properties: {
        progressPopups: {
			default: null,
            type: MissionPopupController
        }
    },

    start() {
        const progressPopupsComp = this.progressPopups;
        this.setPopupComp(progressPopupsComp);
    },

    setPopupComp: function(node) {
        progressPopupsComponent = node;
    },

    onLoad: function () {
        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            if (progressPopupsComponent &&
                progressPopupsComponent.targetChildNode) {
                    progressPopupsComponent.targetChildNode.active = false;
            }
        });
    },
});
