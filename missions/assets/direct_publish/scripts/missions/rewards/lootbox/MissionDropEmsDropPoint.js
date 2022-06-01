const TAG = "MissionDropEmsDropPoint";
const ComponentLog = require('ComponentSALog')(TAG);

const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'dropAnimation';

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Rewards/Lootbox/Drop Ems Drop Point',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
    },

    properties: {
        dropAnimation: AnimationClipProperty.ccAnimationForProperties(
            ANIM_COMPONENT_PROPERTY,
            ['dropFull','dropStart','dropEnd'],
            'Configurable animations for this drop point'
        ),
        dropFull: AnimationClipProperty.arrayPropertyDefinition(
            'dropFull',
            ANIM_COMPONENT_PROPERTY,
            'List of Drop animations for the main portion of this drop, can be used without start and end'
        ),
        index: {
            default: -1,
            type: cc.Integer,
        },
    },

    getIndex() {
        return this.index;
    },

    setIndex(index) {
        this.index = index;
    },

    // Custom event for when a point is clicked on to allow processing by the sequence
    selectDropPointHandler() {
        const customEvent = new cc.Event.EventCustom('dropems_drop_point.selected', true);
        customEvent.detail = {
            dropIndex: this.index,
        };
        this.node.dispatchEvent(customEvent);
    },

    // Animation Promise handling, Play Full requires an index to play a specific animation
    // Future versions will likely require randomization to select an index
    playFull(index) {
        if (this.dropFull.length <= index) {
            this.log.e("Error while trying to play an animation for Drop Point " + this.index + " no animation found for a bucket #" + index);
        }

        return this.dropFull[index].play();
    },
});
