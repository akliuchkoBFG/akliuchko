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
        awardAnimationIndex: {
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
        }
    },

	onLoad: function () {
		this._super();
        this.getComponent(cc.Animation).on('finished', this.onCompleteStepAnimFinished, this);
    },
    
    setAwardsData: function () {
        const dataAwards = this.missionStepInterface._stepData &&
                    this.missionStepInterface._stepData.data &&
                    this.missionStepInterface._stepData.data.award;
        if (dataAwards) {
            this.awardItems = this.handleAwardsData(dataAwards);
            this.numberOfAwards = this.awardItems.length;
            this.awardAnimationActive =  true;
        }
    },

    onCompleteStepAnimFinished: function(event) {
		if (!event.detail || !event.detail.name) {
			return;
        }
        const stepID = this.missionStepInterface.stepID;
        const eventName = event.detail.name.toString();
        const isAwardAnimationFinished = this.awardAnimationIndex >= this.numberOfAwards;
        cc.log('EVENT NAME IN STEP, ', eventName);
        const missionSteps = this.missionStepInterface.missionInterface && this.missionStepInterface.missionInterface._stepData;
        const lastStep = missionSteps && missionSteps[Object.keys(missionSteps).length -1];
        
        if (lastStep && lastStep.data.awarded) {
            cc.log('finalStep');
            // *TO DO
            return;
        }
        // Trigger Claim method after the 'step_complete' animation is successful. 
        if (event.detail.name == 'step_complete' && !isAwardAnimationFinished) {
            this.setAwardsData();
        }

        // Trigger Award animations one by one.
        if (this.awardAnimationActive && !isAwardAnimationFinished) {
            this.awardAnimationKey = this.awardItems[this.awardAnimationIndex].name;
            let awardAnimationName = this.getAwardAnimationName(this.awardAnimationKey);

            this.playStepAnimation(awardAnimationName, false);
            this.awardAnimationIndex += 1;
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
    },

    playStepAnimation(stepName, isMilestone) {
        const comp = this.getComponent(cc.Animation);
        let animationName = stepName;

        if (isMilestone) {
            animationName = 'step_milestone_'.concat(stepName);
        }

        if (animationName && comp) {
            comp.play(animationName);
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
});
