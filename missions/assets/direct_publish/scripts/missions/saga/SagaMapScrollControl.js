const TAG = "SagaMapScrollControl";
const ComponentLog = require('ComponentSALog')(TAG);
const MissionStepInterface = require('MissionStepInterface');
const SagaController = require('SagaController');
const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';

const ANIM_CLIP_NAMES = [
    'fadeIn',
    'fadeOut',
];

/*
 * SagaMapScrollControl provides a button on click event to scroll the saga map PageView
 * to the current mission step. We have two animations, one to fade the button in and another
 * out, to be played when the button should be shown or hidden. Uses SagaController.scrollToNode
 * to handle the pageView scrolling, we mainly have the pageView reference as a way to connect
 * to it's page-turning and pages-update events.
 */
cc.Class({
    extends: cc.Component,

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Saga/SagaMapScrollControl',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        executeInEditMode: false,
    },

    mixins: [ComponentLog, cc.EventTarget],

    properties: {

        sagaController: {
            type: SagaController,
            default: null
        },
        missionStepInterface: {
            type: MissionStepInterface,
            default: null
        },
        animation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            ANIM_CLIP_NAMES,
            [
                'Animations for fading the scroll to current button in and out',
            ].join('\n')
        ),
        fadeIn: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Fade the scroll to current button in'
        ),
        fadeOut: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Fade the scroll to current button out'
        ),
    },

    start(){
        this.fadeIn.sample();
    },

    onLoad: function () {
        this.sagaController.on('saga.step-change', this.onCurrentStepIDChange, this);
        this._onCurrentStep = true;
    },

    onClickScrollToCurrent: function(event) {
        const stepID = this.missionStepInterface.stepID;
        this.sagaController.scrollToStep(stepID);
    },

    onCurrentStepIDChange: function(event){
        /* 
         * Using active stepIDs from mission interface instead of missionStepInterface.stepID because of mission
         * interface update timing when step is claimed causes problems if we do not.
         */
        const activeStepIDs = this.missionStepInterface.missionInterface.getActiveStepIDs();
        if(activeStepIDs.length === 0){
            this.fadeOut.play();
            return;
        } else if(activeStepIDs.length > 1){
            this.log.e('SagaMapScrollControl is invalid for non sequential missions');
        }

        const isCurrentPageActiveStep = +event.detail.stepID === +activeStepIDs[0];
        // If we were not on the current step before but now we are, fade the button out to remove it
        if(isCurrentPageActiveStep && !this._onCurrentStep){
            this.fadeOut.play();
        }
        // If we were on the current button but now we have moved to it, fade the button in to make it available
        else if(!isCurrentPageActiveStep && this._onCurrentStep) {
            this.fadeIn.play();
        }
        this._onCurrentStep = isCurrentPageActiveStep;
    },

});
