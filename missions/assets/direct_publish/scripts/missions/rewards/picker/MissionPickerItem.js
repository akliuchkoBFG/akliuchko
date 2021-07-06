const TAG = "MissionPickerItem";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionRewardTeaser = require('MissionRewardTeaser');
const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add Mission Component/Rewards/Picker Item',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
    },
 
    properties: {
        index: {
            default: 0,
            type: cc.Integer,
            visible: false,
        },        

        // Property name must match ANIM_COMPONENT_PROPERTY
        animation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            [
                'pick_reveal',
                'pick_whiff',
                'pick_idle',
            ],
            [
                'Animation component for reveal of picker item',
                'Adding this component will reveal states for reveal and whiff',
            ].join('\n')
        ),
        pick_reveal: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Animation state that plays when a pick item is a chosen award'
        ),
        pick_whiff: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Animation state that plays when a pick item is not awarded'
        ),
        pick_idle: AnimationClipProperty.propertyDefinition(
            ANIM_COMPONENT_PROPERTY,
            'Animation state that plays before a pick item is chosen'
        ),
        revealNode: MissionRewardTeaser,
        idleDelay: {
            tooltip: 'Offset time to delay before playing this pick item\'s idle animation (in seconds)',
            default: 0,
            type: cc.Float,
        },
    },

    _animateIdle() {
        return this.pick_idle.play();
    },
 
    setIndex(index) {
        this.index = index;
    },

    clickHandler() {
        const customEvent = new cc.Event.EventCustom('lootbox_pickeritem.selected', true);
        customEvent.detail = {
            pickIndex: this.index,
        };
        this.node.dispatchEvent(customEvent);
    },

    assignReward(productPackage) {
        this.pick_reveal.sample();
        this.revealNode.setRewardsFromProductPackage(productPackage);
    },

    animateReveal() {
        this.log.d("Revealing pick item (" + this.node.name + ")");
        if (this.pick_reveal && !this._animating) {
            this._animating = true;
            return this.pick_reveal.play()
            .finally(() => {
                this._animating = false;
            });
        }
        return Promise.resolve();
    },

    animateWhiff() {
        this.log.d("Whiffing pick item (" + this.node.name + ")");
        if (this.pick_whiff && !this._animating) {
            this._animating = true;
            return this.pick_whiff.play()
            .finally(() => {
                this._animating = false;
            });
        }
        return Promise.resolve();
    },

    startIdle() {
        this.scheduleOnce(this._animateIdle, this.idleDelay);
    },

});
