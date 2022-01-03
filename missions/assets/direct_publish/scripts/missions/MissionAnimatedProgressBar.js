const BaseMissionStepComponent = require('BaseMissionStepComponent');
const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';


const clampValue = function(num) {
    return Math.max(Math.min(num, 1), 0);
};

// MissionAnimateableProgressBar | Creates and manages the relative progress and total progress for a bar across steps in a mission, based on an animation timeline
cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Mission Animated Progress Bar',
        help: 'https://bigfishgames.atlassian.net/wiki/spaces/SAG/pages/4008083522/Creator+Progress+Bar+Curved',
    },

    properties: {
        // Represents the current progress along the step (progressAmount/progressMax)
        _progressSegment: {
            default: 0,
            type: 'Float',
            tooltip: 'Actual progress on the current step between 0 and 1, not used for preview',
        },
        // Represents the animatable amount of progress, 0 being the start of the step and 1 being the current progress
        progressDisplay: {
            default: 1,
            type: 'Float',
            range: [0, 1, 0.1],
            slide: true,
            tooltip: 'Animated progress from step start to current progress, this will never animate past a step\'s current progress. See Mission Preview for the current progress',
            notify(){
                // Update the bar in the case that we adjust the preview slider in cocos
                if (CC_EDITOR) {
                    this._updateBar();
                }
            },
        },
        // Property name must match ANIM_COMPONENT_PROPERTY
        animation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            [
                'step_progress',
            ],
            [
                'Animation component for overall reward sequence animation states (optional)',
                'Adding this component will reveal states for the step_progress',
            ].join('\n')
        ),

        // Animation clip containing the key frames of progress from 0 to 1
        step_progress: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Animation state for showing the progress of the bar'
        ),
    },

    // Handles the standard update for the bar, using the step and progress to find the relative percent for the bar
    _updateBar: function() {
        // Setup a few variables to use as guides for this segment of the bar, !making sure they are ints for calculations!
        const id = +this.missionStepInterface.stepID;
        const numIDs = this.missionStepInterface.missionInterface.getAllStepIDs().length;

        // Calculate start and end points
        const startPoint = id / numIDs;
        const endPoint = (1 + id) / numIDs;

        // Get the progress along the step using this.progressSegment (stepProgress/maxPorgress) and the start and end points
        const progress = startPoint + ((endPoint - startPoint) * (this.progressSegment * this.progressDisplay));
        
        // Grab the relative time within the animation clip and set it within the animation to get the current state of the progress bar
        const relativeTime = clampValue(progress) * this.step_progress.animationClip.duration;
        this.animation.setCurrentTime(relativeTime, this.step_progress.clipName);
    },

    // Update progress variables whenever the step data is updated and call into the bar update
    onUpdateMissionStepData: function() {
        // Sync with new mission data
        if (this.missionStepInterface) {
            const stepProgress = this.missionStepInterface.getProgressAmount();
            const maxProgress = this.missionStepInterface.getProgressMax();
            this.progressSegment = stepProgress/maxProgress;
            this._updateBar();
        } else {
            this.log.e("Mission Step Interface not found or is null in MissionAnimatedProgressBar");
        }
    },    
});
