const MissionStepCell = require('MissionStepCell');
const AnimationClipProperty = require('AnimationClipProperty');
const MissionStepStateController = require('MissionStepStateController');

const TAG = "DailyMissionStepCell";
const ComponentLog = require('ComponentSALog')(TAG);

const ANIM_COMPONENT_PROPERTY = 'animation';

cc.Class({
	extends: MissionStepCell,
	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Daily/Step Cell',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		disallowMultiple: true,
	},

	properties: {
		// Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			[
				'claim',
			],
			[
				'Animation component for daily mission choreography (optional)',
				'Adding this component will reveal state for Claim',
			].join('\n')
		),

		claim: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for claiming a step reward'
		),

		stepStateController: {
			default: null,
			type: MissionStepStateController,
			tooltip: 'Providing the state controller allows configuring each step cell with the same scene level reward sequence',
		},

		pointsDooberSource: {
			default: null,
			type: cc.Node,
			tooltip: 'Node to provide position info for where to start emitting points doobers',
		},
	},

	playClaim() {
		return this.claim.play();
	},

	getDooberSourceWorldPosition() {
		const sourceNode = this.pointsDooberSource || this.node;
		return sourceNode.convertToWorldSpaceAR(cc.p(0, 0));
	},

	updateCellData(data) {
		this._super(data);
		if (this.stepStateController) {
			this.stepStateController.claimSequence = data.stepRewardSequence;
		}
	},

	unuse() {
		if ( this.stepStateController) {
			this.stepStateController.claimSequence = null;
		}
		this._super();
	},
});
