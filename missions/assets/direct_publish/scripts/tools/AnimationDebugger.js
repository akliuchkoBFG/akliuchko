const TAG = "AnimationDebugger";
const ComponentLog = require('ComponentSALog')(TAG);

const AllAnimationEvents = [
	'play',
	'stop',
	'pause',
	'resume',
	'lastframe',
	'finished',
];

const AnimationEventToggles = cc.Class({
	name: 'AnimationEventToggles',
	properties: {
		play: {
			default: true,
			tooltip: 'Track when a state begins playing',
		},
		stop: {
			default: true,
			tooltip: 'Track when a state stops playing, when an animation finishes or is stopped prematurely because another animation started',
		},
		pause: {
			default: true,
			tooltip: 'Track when a state is paused',
		},
		resume: {
			default: true,
			tooltip: 'Track when a state is resumed',
		},
		lastframe: {
			default: true,
			tooltip: 'Track when a looping animation state hits the last frame',
			displayName: 'Last Frame',
		},
		finished: {
			default: true,
			tooltip: 'Track when an animation state finishes playing naturally',
		},
	},
});

cc.Class({
	extends: cc.Component,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add SAComponent/Animation Debugger',
		executeInEditMode: true,
		disallowMultiple: true,
	},

	properties: {
		anim: {
			default: null,
			type: cc.Animation,
			tooltip: 'Animation component to debug',
			displayName: 'Animation',
		},
		events: {
			default: function() {
				return new AnimationEventToggles();
			},
			type: AnimationEventToggles,
			tooltip: 'List of animation events to track',
		},
		infoLabel: {
			default: null,
			type: cc.Label,
			tooltip: 'Display most recent animation event info in a label',
		},
	},

	onEnable() {
		if (CC_EDITOR && !this.anim) {
			// Default to animation node on this component when adding in editor
			const anim = this.getComponent(cc.Animation);
			if (anim) {
				this.anim = anim;
			}
		}
		if (CC_EDITOR || !(this.anim instanceof cc.Animation)) {
			return;
		}
		this._listeners = {};
		AllAnimationEvents.forEach((eventName) => {
			if (!this.events[eventName]) {
				return;
			}
			this._addEventListener(this.anim, eventName);
		});
	},

	_truncateTime(interval) {
		// Truncate to three decimal places
		return Math.floor(interval * 1e3) * 1e-3;
	},

	_addEventListener(anim, eventName) {
		if (this._listeners[eventName]) {
			this._removeEventListener(anim, eventName, this._listeners[eventName]);
		}
		this._listeners[eventName] = function(evt) {
			const animState = evt.detail;
			const nodeName = this.anim.node.name;
			const animName = animState.name;
			const time = this._truncateTime(animState.time);
			const duration = this._truncateTime(animState.duration);
			const message = `node:${nodeName}, state:${animName} event:${eventName} time:${time}/${duration}`;
			this.log.d(message);
			if (this.infoLabel) {
				this.infoLabel.string = message;
			}
		};
		anim.on(eventName, this._listeners[eventName], this);
	},

	_removeEventListener(anim, eventName) {
		if (!this._listeners[eventName]) {
			return;
		}
		anim.off(eventName, this._listeners[eventName], this);
	},

	onDisable() {
		if (CC_EDITOR || !(this.anim instanceof cc.Animation)) {
			return;
		}
		AllAnimationEvents.forEach((eventName) => {
			this._removeEventListener(this.anim, eventName);
		});
	},
});
