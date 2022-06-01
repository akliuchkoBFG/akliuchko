const TAG = 'SpineSoundController';
const ComponentLog = require('ComponentSALog')(TAG);

const SAAudioSource = require('SAAudioSource');

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        menu: 'Miscellaneous/Spine Sound Controller',
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        requireComponent: sp.Skeleton,
    },

    properties: {
        spine: {
            get() {
                if (!this._spine) {
                    this._spine = this.node.getComponent(sp.Skeleton);
                }
                return this._spine;
            },
            readonly: true,
            visible: true,
            type: sp.Skeleton,
            tooltip: 'Spine animation to check for sound events'
        },
        soundNode: {
            notify() {
                this.sounds = this.soundNode.getComponentsInChildren(SAAudioSource);
            },
            default: null,
            type: cc.Node,
            tooltip: 'Parent node to all sound nodes, each sound node must be of type SAAudioSource',
        },
        sounds: {
            default: [],
            type: [SAAudioSource],
            readonly: true,
            visible: true,
            tooltip: 'List of sound nodes containing different sounds based on the event to which each corresponds',
        },
        showAdvance: {
            default: false,
            tooltip: 'Show advances settings, such as custom Spine event names',
        },
        customSoundEvents: {
            default: [],
            type: [cc.String],
            visible: function() {
                return this.showAdvance;
            },
            tooltip: 'List of events that will trigger sounds based on the spine listener, NOTE: These are index based and ignore node names',
        },
    },

    onEnable: function () {
        if (this.customSoundEvents.length > 0) {
            this._registerSoundEventsByIndex();
        } else {
            this._registerSoundEventsByName();
        }
        this._registerSpineListener();
    },

    // Handles the standard setup for playing sounds based on the node names held in this.sounds, this is name based
    _registerSoundEventsByName() {
        for (let i = 0; i < this.sounds.length; i++) {
            const soundName = this.sounds[i].node.name;
            this.node.on(soundName + ".sfx", function (event) {
              this.soundNode.getChildByName(soundName).getComponent(SAAudioSource).play();
            }, this);
        }
    },

    // Handles custom events based on Spine that may not match the node names of the sounds in the layout, this is index based
    _registerSoundEventsByIndex() {
        if (this.customSoundEvents.length > this.sounds.length) {
            this.log.e("More custom events defined than number of sound nodes given, either add more sounds or remove some custom events");
        }
        for (let i = 0; i < this.customSoundEvents.length; i++) {
            this.node.on(this.customSoundEvents[i] + ".sfx", function (event) {
              this.sounds[i].play();
            }, this);
        }
    },

    // Handles the Spine Listener that will trigger an emit based on the received event from the Spine animation held in this.spine
    _registerSpineListener() {
        this.spine.setEventListener((track, event) => {
            if (event && event.data && event.data.name) {
                this.node.emit(event.data.name + ".sfx");
            }
        });
    },

    // clean up event listener
    onDisable() {
        this.spine.setEventListener(null);
    },
});
