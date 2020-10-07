const MissionInterface = require('MissionInterface');

cc.Class({
    extends: cc.Component,
    properties: {
        missonInfoNode:  {
            default: null,
            type: cc.Node
        },
        missonStepNode:  {
            default: null,
            type: cc.Node
        },
		missionInterface: {
			default: null,
            type: MissionInterface,
        },
        firstStep: {
            default: 0,
            visible: false,
        },
    },

    onLoad: function () {
        const missionInterfaceComp = this.node.getComponent('MissionInterface');
        if (missionInterfaceComp) {
            this.missionInterface = missionInterfaceComp;
            this.missionInterface.on('updateMissionDataEvent', this.toggleMissionInfoPopoup, this);
        }
    },

    onNextStep: function() {
        console.log('XXXXXXX');
    },

    toggleMissionInfoPopoup: function() {
        const firstStepData = this.missionInterface.getStepData(this.firstStep);
        if (firstStepData) {
            if (firstStepData.data && 
                firstStepData.data.progress === 0 &&
                firstStepData.data.state == 'active') {
                    this.missonStepNode.opacity = 0;
                    this.missonInfoNode.active = true;
                    const stepIDs = this.missionInterface.getActiveStepIDs();
                    const comp = this.getComponent(cc.Animation);

                    // *TO DO*
                    if (stepIDs) {
                        this._toggleAnimationPlay('step0', comp, true);
                    }

                    this._toggleAnimationPlay('mission_info', comp, false);
            } else {
                this.goToProgressPopup();
            }
        }
    },

    goToProgressPopup: function() {
        if (this.missonInfoNode.active) {
            this.missonInfoNode.active = false;
            this.missonStepNode.opacity = 255;
        }
        const missionComp = this.missionInterface;
        const missionCompAnim = missionComp.node.getComponent(cc.Animation);
         // *TO DO*
        this._toggleAnimationPlay('step0', missionCompAnim, false);
    },

    _toggleAnimationPlay: function(anim, node, stop) {
        if (stop && node) {
            node.stop(anim);
        } else if (anim !== '' && node) {
			node.play(anim);
		}
	},
});
