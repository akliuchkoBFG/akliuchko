const TAG = "MissionPickerItemAnimationHelper";
const ComponentLog = require('ComponentSALog')(TAG);

const MissionPickerItem = require('MissionPickerItem');
const EditorButtonProperty = require('EditorButtonProperty');

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        executeInEditMode: true,
        menu: 'Rewards/Picker/Pick Animation Helper',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
    },
 
    properties: {
        revealAnim: {
            type: cc.AnimationClip,
            default: null,
            tooltip: 'Helper for setting the animation in a set of child nodes',
            editorOnly: true,
            notify() {
                if (!CC_EDITOR) {
                    return;
                }
                const picks = this.node.getComponentsInChildren(MissionPickerItem);
                this.log.d("replacing animations for all picks" + picks.length);
                for (let i = picks.length - 1; i >= 0; i--) {
                    picks[i].setReveal(this.revealAnim);
                }
            },
        },
        whiffAnim: {
            type: cc.AnimationClip,
            default: null,
            tooltip: 'Helper for setting the animation in a set of child nodes',
            editorOnly: true,
            notify() {
                if (!CC_EDITOR) {
                    return;
                }
                const picks = this.node.getComponentsInChildren(MissionPickerItem);
                this.log.d("replacing animations for all picks" + picks.length);
                for (let i = picks.length - 1; i >= 0; i--) {
                    picks[i].setWhiff(this.whiffAnim);
                }
            },
        },
        idleAnim: {
            type: cc.AnimationClip,
            default: null,
            tooltip: 'Helper for setting the animation in a set of child nodes',
            editorOnly: true,
            notify() {
                if (!CC_EDITOR) {
                    return;
                }
                const picks = this.node.getComponentsInChildren(MissionPickerItem);
                this.log.d("replacing animations for all picks" + picks.length);
                for (let i = picks.length - 1; i >= 0; i--) {
                    picks[i].setIdle(this.idleAnim);
                }
            },
        },
        // Editor configuration helper
        updateButton: {
            default: function() {
                return new EditorButtonProperty('Update Animations');
            },
            serializable: false,
            type: EditorButtonProperty,
            tooltip: 'Update all child picks with the appropriate animations',
        },
    },

    __preload() {
        if (CC_EDITOR) {
            this.updateButton.action = this.updatePickAnimations.bind(this);
        }
    },

    updatePickAnimations() {
        if (!CC_EDITOR) {
            return;
        }
        const picks = this.node.getComponentsInChildren(MissionPickerItem);
        this.log.d("replacing animations for all picks" + picks.length);
        for (let i = picks.length - 1; i >= 0; i--) {
            picks[i].setReveal(this.revealAnim);
            picks[i].setWhiff(this.whiffAnim);
            picks[i].setIdle(this.idleAnim);
        }
    },
});
