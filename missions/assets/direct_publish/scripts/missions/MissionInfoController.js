const TAG = "MissionInfoController";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionStepComponent = require('BaseMissionStepComponent');
const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
	'intro',
	'outro',
];

cc.Class({
	extends: BaseMissionStepComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Mission Info Controller',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		// TODO: help: 'url/to/help/wikipage'
	},

	properties: {
		announcement: {
			default: true,
			tooltip: 'Show the info view state on popup open without any mission progress made',
		},
		// Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Required animation component for showing/hiding mission info',
				'Adding this component will reveal states for intro and outro',
			].join('\n')
		),

		intro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Show the mission info'
		),

		outro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Hide the mission info'
		),
	},

	onUpdateMissionStepData() {
		if (CC_EDITOR) {
			return;
		}
		if (this.announcement) {
			// Show if no mission progress has been made
			const stepID = this.missionStepInterface.stepID;
			const progress = this.missionStepInterface.getProgressAmount();
			if (+stepID === 0 && progress === 0) {
				this.show();
			}
		}
	},

	show() {
		this._visible = true;
		if (!this.intro.isValid()) {
			this.log.e("Invalid intro animation clip");
		}
		this.intro.play();
	},

	hide() {
		this._visible = false;
		if (!this.outro.isValid()) {
			this.log.e("Invalid outro animation clip");
		}
		this.outro.play();
	},

	toggle() {
		if (this._visible) {
			this.hide();
		} else {
			this.show();
		}
	},
});
