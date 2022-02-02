const TAG = 'SagaStepBannerDisplay';
const ComponentLog = require('ComponentSALog')(TAG);
const SagaStepBannerBehavior = require('SagaStepBannerBehavior');
const SpineStateProperty = require('SpineStateProperty');
const AnimationClipProperty = require('AnimationClipProperty');

const SPINE_STATE_NAMES = [
    'banner_close',
    'banner_open',
    'banner_open_static',
];

const ANIM_CLIP_NAMES = [
    'onOpenAnim',
    'onCloseAnim',
];

const SKELETON_COMPONENT_PROP = 'bannerSkeleton';
const ANIM_COMPONENT_PROPERTY = 'animation';

//Keeps us from juggling multiple booleans and makes the spine state logic easier to follow
const BANNER_ANIM_STATE = cc.Enum({
    "NOT_STARTED": 0,
    "BEGIN": 1,
    "COMPLETE": 2
});

/*
 * SagaStepBannerViewController controls how the saga pillar banner will appear when opened.
 * How the banner is opened is the responsibility of SagaStepBannerBehavior. Current implementation
 * mostly deals with the spine animations for the banner itself. The information supposed to be displayed
 * on it isn't here, but there is a rough UML design of how it might get implemented.
 * https://bigfishgames.atlassian.net/wiki/spaces/SAG/pages/3862429713/saga+step+node+design
 */
cc.Class({
    extends: cc.Component,

    editor: CC_EDITOR && {
        menu: 'Missions/Types/Saga/Step Banner Controller',
        executeInEditMode: true,
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
    },

    mixins: [ComponentLog, cc.EventTarget],

    properties: {

        bannerBehavior: {
            type: SagaStepBannerBehavior,
            default: null
        },

        bannerSkeleton: SpineStateProperty.spSkeletonForProperties(
            SKELETON_COMPONENT_PROP,
            SPINE_STATE_NAMES,
            [
                'Skeleton component for board game randomizer state animations',
                'Adding this component will reveal states for intro, loop, and outro',
            ].join('\n')
        ),

        banner_close: SpineStateProperty.propertyDefinition(
            SKELETON_COMPONENT_PROP,
            'open static',
            'Banner Close'
        ),
        banner_open: SpineStateProperty.propertyDefinition(
            SKELETON_COMPONENT_PROP,
            'open',
            'Banner Open'
        ),
        banner_open_static: SpineStateProperty.propertyDefinition(
            SKELETON_COMPONENT_PROP,
            'close',
            'Banner Open Static'
        ),
        animation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            ANIM_CLIP_NAMES,
            [
                'Required animations to do display and hide animations for the banner',
            ].join('\n')
        ),

        onOpenAnim: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'On opening banner. Will be played with banner_open spine animation'
        ),

        onCloseAnim: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'On closeing banner. Will be played with banner_close spine animation'
        ),
    },

    __preload:SpineStateProperty.createPreloadFunction(SPINE_STATE_NAMES),

    // use this for initialization
    onLoad: function () {
        this._bannerOpen = false;
        this._bannerOpenPromise = null;
        this._banneClosePromise = null;
        this._bannerOpenState = BANNER_ANIM_STATE.NOT_STARTED;
        this._bannerCloseState = BANNER_ANIM_STATE.NOT_STARTED;

        if(this.bannerBehavior) {
            this.bannerBehavior.on('banner.open', this.openBanner, this);
            this.bannerBehavior.on('banner.close', this.closeBanner, this);
            this.bannerBehavior.on('banner.close-immediate', this._doClose, this);
        }
    },

    clickBanner: function() {
        // If banner is not open then open it.
        if(!this._bannerOpen && this._bannerCloseState !== BANNER_ANIM_STATE.BEGIN){
            this._doOpen();
        }
        // Banner is open and now we are closing it.
        else if(this._bannerOpen && this._bannerOpenState !== BANNER_ANIM_STATE.BEGIN) {
            this._doClose();
        }
    },

    openBanner: function(){
        if(this._bannerCloseState !== BANNER_ANIM_STATE.BEGIN){
            this._doOpen();
        } else {
            this._bannerClosePromise.then(() => {
                this._doOpen();
            });
        }
    },

    closeBanner: function(){
        // Banner is open and now we are closing it.
        if(this._bannerOpenState !== BANNER_ANIM_STATE.BEGIN) {
            this._doClose();
        } else {
            this._bannerOpenPromise.then(() => {
                this._doClose();
            });
        }
    },

    _doOpen: function(){
        if(this._bannerOpenPromise){
            this._bannerOpenPromise.cancel();
        }
        if(this._bannerClosePromise){
            this._bannerClosePromise.cancel();
        }
        this._bannerOpen = true;
        this._bannerOpenState = BANNER_ANIM_STATE.BEGIN;
        this._bannerOpenPromise = this.banner_open.play()
        .then(() => {
            const animOpts = {
                setToSetupPose: false,
            };
            this._bannerOpenState = BANNER_ANIM_STATE.COMPLETE;
            return this.banner_open_static.play(animOpts);
        });
        // Ignore rejections from interrupted animations
        this._bannerOpenPromise.suppressUnhandledRejections();

        this.onOpenAnim.play()
        .suppressUnhandledRejections();
    },

    _doClose: function(){
        if(this._bannerOpenPromise){
            this._bannerOpenPromise.cancel();
        }
        if(this._bannerClosePromise){
            this._bannerClosePromise.cancel();
        }
        this._bannerOpen = false;
        this._bannerCloseState = BANNER_ANIM_STATE.BEGIN;
        this._bannerClosePromise = this.banner_close.play()
        .then(() => {
            this._bannerCloseState = BANNER_ANIM_STATE.COMPLETE;
        });
        // Ignore rejections from interrupted animations
        this._bannerClosePromise.suppressUnhandledRejections();

        this.onCloseAnim.play()
        .suppressUnhandledRejections();
    },
});
