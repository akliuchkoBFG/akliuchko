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
        missionEventHandler: {
            default: null,
            type: cc.Component.EventHandler,
        },
    },

    onLoad: function () {
        const missionInterfaceComp = this.node.getComponent('MissionInterface');
        const missionStepInterfaceComp = this.missonStepNode.getComponent('MissionStepInterface');
        this.missionAnimationComp = this.missionInterface.node.getComponent(cc.Animation);

        if (missionInterfaceComp) {
            this.missionInterface = missionInterfaceComp;
            this.missionInterface.on('updateMissionDataEvent', this.toggleMissionInfoPopoup, this);
        }
        if (missionStepInterfaceComp) {
            this.missionStepAnimationComp = this.missonStepNode.getComponent(cc.Animation);
            this.missionStepInterface = missionStepInterfaceComp;
            missionStepInterfaceComp.on('updateMissionStepDataEvent', this.clearMissionStepAnimation, this);
        }
    },

    clearMissionStepAnimation: function () {
        if (this.missionStepAnimationComp && this.missionStepInterface.stepID == 0) {
            this.missionStepAnimationComp.stop();
        }
    },

    clearMissionAnimation: function () {
        if (this.missionAnimationComp) {
            this.missionAnimationComp.stop();
        }
    },

    toggleMissionInfoPopoup: function() {
        const firstStepData = this.missionInterface.getStepData(this.firstStep);
        if (firstStepData &&
            firstStepData.data && 
            firstStepData.data.progress === 0 &&
            firstStepData.data.state == 'active') {

                // Case No Progress made in mission and step is 0;
                this.missonStepNode.opacity = 0;
                this.missonInfoNode.active = true;
                this.clearMissionAnimation();
                if (this.missionEventHandler) {
                    let data = {
                        animationName: 'info_intro',
                    };
                    this.missionEventHandler.emit([JSON.stringify(data)]);
                }
                this._play('mission_info', this.missionAnimationComp);
        } else {
            this.goToProgressPopup();
        }
    },

    goToProgressPopup: function() {
        if (this.missonInfoNode.active) {

            this.missonInfoNode.active = false;
            if (this.missionEventHandler) {
                let data = {
                    animationName: 'info_outro',
                };
                this.missionEventHandler.emit([JSON.stringify(data)]);
            }

            this.missonStepNode.opacity = 255;
            
            // redo animations in mission and mission_step nodes;
            this._play('step0', this.missionAnimationComp);
            this._play('step_intro', this.missionStepAnimationComp);
        }
        return
    },

    _play: function(anim, node) {
        if (anim !== '' && node) {
			node.play(anim);
		}
	},
});
