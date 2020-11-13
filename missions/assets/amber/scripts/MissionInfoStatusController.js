const BaseMissionComponent = require('BaseMissionComponent');
const ButtonChestComponent = require('ButtonChestComponent');

cc.Class({
    extends: BaseMissionComponent,

    editor: CC_EDITOR && {
		requireComponent: cc.Animation,
    },
    
    properties: {
        missonInfoNode: {
            default: null,
            type: cc.Node
        },
        missonStepNode: {
            default: null,
            type: cc.Node
        },
        firstStep: {
            default: 0,
            visible: false,
        },
        missionEventHandler: {
            default: null,
            type: cc.Component.EventHandler,
        },
        finalAwardClaimed: {
            default: false,
            visible: false,
        },
        chestButton: {
            default: null,
            type: ButtonChestComponent,
        }
    },

    onLoad: function () {
        this.missonStepNode.opacity = 255;
        this.missionAnimationComp = this.missionInterface.node.getComponent(cc.Animation);
        if (this.missionInterface) {
            this.missionInterface.on('updateMissionDataEvent', this.toggleMissionInfoPopoup, this);
            // this.missionInterface.on('claimedMissionAward', this.onClaim, this);
            this.missionAnimationComp.on('finished', this.onMissionAnimationFinished, this);
        }

        const missionStepInterfaceComp = this.missonStepNode.getComponent('MissionStepInterface');

        if (missionStepInterfaceComp) {
            this.missionStepAnimationComp = this.missonStepNode.getComponent(cc.Animation);
            this.missionStepInterface = missionStepInterfaceComp;
            missionStepInterfaceComp.on('updateMissionStepDataEvent', this.clearMissionStepAnimation, this);
            this.missionStepAnimationComp.on('finished', this.onMissionStepAnimationFinished, this);
        }
    },

    onMissionAnimationFinished: function(e) {
        if (!e.detail || !e.detail.name) {
            return;
        }

        if (e.detail.name == 'step_mission_ended') {
            return;
        }

        if (e.detail.name == 'step_mission_chest') {
            this.playChest = false;
            // this.missionAnimationComp.play('step_mission_ended');
        }
    },

    onMissionStepAnimationFinished: function (e) {
        if (!e.detail || !e.detail.name) {
            return;
        }
        if (e.detail.name == 'step_milestone_13') {
            this.playChestAnimation();
        }
    },

    playChestAnimation: function () {
        if (this.isFinalStep) {
            this.finalStepClaimed = true;
            this.chestButton.toggleButtonInteractable();
            this.playChest = true;
        }
    },

    onUpdateMissionData: function () {
        if (this.isFinalStep) {
            this.finalAwardClaimed = true;
        }
    },

    onFinalStepEvent: function () {
        if (!this.isFinalStep) {
            return;
        } else {
            let allAwarded = this.missionInterface.isAllStepsComplete();
            if (allAwarded) {
                // Something wrong here.
                // ERR: [missionInterface] ClaimMissionAward failed, [object Object]
                this.allAwarded = true;
                // this.missionInterface.claimMissionAward();
            }
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

    isFinalMissionStep: function () {
        const lastStep = this.missionInterface.getFinalStepID();
        const currentStep = this.missionStepInterface.stepID;

        return currentStep == lastStep;
    },

    toggleMissionInfoPopoup: function () {
        const firstStepData = this.missionInterface.getStepData(this.firstStep);
        this.isFinalStep = this.isFinalMissionStep();

        if (this.isFinalStep) {
            this.onFinalStepEvent();
        }

        if (this.isFinalStep && this.playChest) {
            this.missionAnimationComp.play('step_mission_chest');
            return;
        }

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

    goToProgressPopup: function () {
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

    _play: function (anim, node) {
        if (anim !== '' && node) {
            node.play(anim);
        }
    },
});
