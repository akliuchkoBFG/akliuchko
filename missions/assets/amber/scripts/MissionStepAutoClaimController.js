const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: cc.Animation,
        menu: 'Add Mission Component/Step State Controller',
        executeInEditMode: true,
    },

    properties: {
        milestoneSteps: {
            default: [],
            type: [cc.Integer],
            multiline: true,
            tooltip: 'Steps that contain a special reward item',
        },
        playedAwardAnimationIndex: {
            default: 0,
            type: cc.Integer,
            visible:false
        },
        awardAnimationActive: {
            default: false,
            visible: false,
        },
        claimDone: {
            default: false,
            visible: false,
        },
        awardAnimationKey: {
            default: 'ProductPackageItemChips',
            visible: false,
        },
        finalMissionAnimationPlayed: {
            default: false,
            visible: false,
        },
        playButton: cc.Node,
    },

	onLoad: function () {
		this._super();
        this.playedAwardAnimationIndex = 0;
        this.currentStepCompleted = false;

        const animationComp = this.getComponent(cc.Animation);

        animationComp.on('finished', this.onCompleteStepAnimFinished, this);

        if (this.missionStepInterface && this.missionStepInterface.missionInterface) {
            this.missionStepInterface.missionInterface.on('updateMissionDataEvent', this.onUpdateMissionData, this);
        }

        let currentAppState;
        const appState = {
            background: 'in_background',
            foreground: 'in_foreground',
        }

        // For event when the app entering background
        cc.game.on(cc.game.EVENT_HIDE, function () {
            currentAppState = appState.background;
            overrideAnimationBehavior(currentAppState);
        });

        // For event when the app entering foreground
        cc.game.on(cc.game.EVENT_SHOW, function () {
            currentAppState = appState.foreground;
            overrideAnimationBehavior(currentAppState);
        });

        const overrideAnimationBehavior = (state) => {
            const anim = this.animationState;
            if (anim && anim.isPlaying && state == appState.background) {
                animationComp.pause();
            } else if (anim && state == appState.foreground) {
                animationComp.resume();
            }
        }
    },

    setAwardsData: function () {
        const dataAwards = this.missionStepInterface._stepData &&
                    this.missionStepInterface._stepData.data &&
                    this.missionStepInterface._stepData.data.award;
        if (dataAwards) {
            this.awardItems = this.handleAwardsData(dataAwards);
            this.numberOfAwards = this.awardItems && this.awardItems.length;
            this.awardAnimationActive =  true;
        }
    },

    onUpdateMissionData: function() {
        this.allStepsCompleted = this.missionStepInterface.missionInterface.isAllStepsComplete();
        if (!this.playButton.active) {
            this.togglePlayButton();
        }
	},

    onCompleteStepAnimFinished: function(event) {
		if (!event.detail || !event.detail.name || this.allStepsCompleted) {
            cc.log('MISSION ENDED');
			return;
        }

        this.animationState = null;
       
        // Trigger Claim method after the 'step_complete' animation is successful. 
        if (event.detail.name == 'step_complete') {
            this.currentStepCompleted = true;
            this.setAwardsData();
        }
        
        if (this.currentStepCompleted) {
            const stepID = this.missionStepInterface.stepID;
            const eventName = event.detail.name.toString();
            const isAwardAnimationFinished = this.playedAwardAnimationIndex >= this.numberOfAwards;

            // Trigger Award animations one by one.
            if (this.awardAnimationActive && !isAwardAnimationFinished) {
    
                this.awardAnimationKey = this.awardItems && this.awardItems[this.playedAwardAnimationIndex].name;
                let awardAnimationName = this.getAwardAnimationName(this.awardAnimationKey);
    
                if (this.awardAnimationKey && awardAnimationName) {
                    this.playStepAnimation(awardAnimationName, false);
                    this.playedAwardAnimationIndex += 1;
                }
            }
    
            // Trigger milestone animation.
            if (isAwardAnimationFinished && !this.claimDone) {
                const isMilestoneStepEventFinished = eventName.includes('step_milestone');
                const isMilestoneStep =  this.milestoneSteps.indexOf(stepID * 1) !== -1;
    
                if (isMilestoneStep && !isMilestoneStepEventFinished) {
                    this.playStepAnimation(stepID, true);
                } else {
                    this.missionStepInterface.claimAward();
                    this.claimDone= true;
                }
            }
        }
    },

    playStepAnimation(stepName, isMilestone) {
        const comp = this.getComponent(cc.Animation);
        let animationName = stepName;

        if (isMilestone) {
            animationName = 'step_milestone_'.concat(stepName);
        }

        if (animationName && comp) {
            const animState = comp.play(animationName);
            this.setAnimationSpecs(animState);
        }
    },

    handleAwardsData: function (awards) {
        let _awards = [];

        for (let award in awards) {
            const _award = {
                name: award,
                data: awards[award][0],
            };

            _awards.push(_award);
        }
        return _awards;
    },

    getAwardAnimationName: function (award) {
        let name = '';
        switch (award) {
            case 'ProductPackageItemChips':
                name = 'win_chips';
                break;
            case 'ProductPackageItemFreeSpins':
                name = 'win_spins'
                break;
            case 'ProductPackageItemCollectionChest':
                name = 'win_chest'
                break;
            case 'ProductPackageItemCollectionFrames':
                name = 'win_frames'
                break;
            default:
                break;
        }
        return name;
    },

    // Showe / Hide Play button if NO buyInId's are availabe in the current Step.
    togglePlayButton: function() {
        const buyInIDs = this.missionStepInterface.getBuyInIDs();

        if (!buyInIDs && this.playButton.active) {
            this.playButton.active = false;
        } else {
            this.playButton.active = true;
            // full opacity will be triggered in 'step_intro'animation;
            this.playButton.setOpacity = 0;
        }
    },

    setAnimationSpecs: function (specs) {
        if (specs) {
            this.animationState = specs;
        }
    }
});
