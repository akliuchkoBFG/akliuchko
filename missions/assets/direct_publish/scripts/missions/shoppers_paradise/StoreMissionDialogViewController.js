const AnimationClipProperty = require('AnimationClipProperty');

const TAG = 'StoreMissionDialogViewController';
const ComponentLog = require('ComponentSALog')(TAG);

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
    'showDialog',
    'hideDialog'
];

cc.Class({
    extends: cc.Component,

    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        menu: 'Missions/Types/Shopping Spree/Store Mission Dialog View Controller',
    },

    properties: {
        animation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            ANIM_CLIP_NAMES,
            [
                'Animation component for showing and hiding the purchase confirmation dialog',
            ].join('\n')
        ),

        showDialog: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Show Dialog'
        ),

        hideDialog: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Hide Dialog'
        ),
    },

    // use this for initialization
    onLoad: function () {
        this._index = -1;
        this._buttonsActive = false;
    },

    /*
     * Plays the showDialog animation clip. It is expected that this anim clip will
     * display the dialog by enabling nodes and/or changing node opacity
     */
    showDisplay: function(){
        //Return early if index is -1
        if(this._index === -1){
            return;
        }
        if (!this.showDialog.isValid()) {
            this.log.e("Invalid showDialog animation clip");
        }
        return this.showDialog.play().bind(this)
        .then(function(){
            this._buttonsActive = true;
        });
    },

    /*
     * Setter for this._index
     * Intended to be an index of purchasable items. Not every dialog may need to
     * have this
     */
    setIndex: function(index){
        this._index = index;
    },

    /*
     * Plays the hideDialog animation clip. It is expected that this anim clip will
     * visually hide or remove the dialog by disabling nodes and/or changing node opacity
     */
    hideDisplay: function(evt){
        if(!this._buttonsActive){
            return;
        }
        if(!this.hideDialog.isValid()){
            this.log.e("Invalid hideDialog animation clip");
        }
        this._buttonsActive = false;
        return this.hideDialog.play().bind(this)
        .then(function(){
            this.emit('storeItemsEnable', {
                enable: true
            });
        });
    }


});
