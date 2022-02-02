const BaseMissionStepComponent = require('BaseMissionStepComponent');

const clampPercent = function(num) {
    return Math.max(Math.min(num, 1), 0);
};

// MissionSementedProgressBar | Creates and manages the relative progress and total progress for a bar across steps in a mission, based on predefined segments
cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: cc.Animation,
        menu: 'Missions/Progress/Segmented Progress Bar',
    },

    properties: {
        _progressSegment: {
            default: 0,
            type: 'Float',
            tooltip: 'Actual progress on the current step between 0 and 1, not used for preview',
        },
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
        fillSprite: {
            default: null,
            type: cc.Sprite,
            tooltip: 'Sprite used to fill the progress bar, expected to be the full length of the bar'
        },
        // Optional end points for each segment of the bar, if an end point doesn't exist it will be calculated
        stepEndPoints: {
            default: [],
            type: [cc.Float],
            tooltip: 'End points for each step to control the fill of the progress bar, these can be adjusted to match other art features'
        },
    },

    // Handles the standard update for the bar, using the step and progress to find the relative percent for the bar
    _updateBar: function () {
        if (!this.fillSprite) {
            if(CC_EDITOR) {
                Editor.warn("There is no fillSprite attached to the progress bar, bar will not be updated.");
            }
            return;
        }

        // setup a few variables to use as guides for this segment of the bar, !making sure they are ints for calculations!
        const id = +this.missionStepInterface.stepID;
        const numIDs = this.missionStepInterface.missionInterface.getAllStepIDs().length;

        // calculate start and end points, if the segmented values are included use those values first, otherwise default to even spacing
        const startPoint = this.stepEndPoints[id - 1] ? this.stepEndPoints[id - 1] : id / numIDs;
        const endPoint = this.stepEndPoints[id] ? this.stepEndPoints[id] : (1 + id) / numIDs;

        // Get the progress along the step using this.progressSegment (stepProgress/maxPorgress) and the start and end points
        const progress = startPoint + ((endPoint - startPoint) * (this.progressSegment * this.progressDisplay));
        
        // update the fillRange based on the relative progress in this step/segment
        this.fillSprite.fillRange = clampPercent(progress);
    },

    // Update progress variables whenever the step data is updated and call into the bar update
    onUpdateMissionStepData: function() {
        // sync with new mission data
        if (this.missionStepInterface) {
            const stepProgress = this.missionStepInterface.getProgressAmount();
            const maxProgress = this.missionStepInterface.getProgressMax() || -1;
            this.progressSegment = stepProgress/maxProgress;
            this._updateBar();
        } else {
            this.log.e("Mission Step Interface not found or is null in MissionSegmentedProgressBar");
        }
    },    
});
