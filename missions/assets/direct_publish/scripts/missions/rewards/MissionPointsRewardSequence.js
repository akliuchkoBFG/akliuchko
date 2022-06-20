const TAG = "MissionPointsRewardSequence";
const ComponentLog = require('ComponentSALog')(TAG);
const MissionRewardSequence = require('MissionRewardSequence');
const AnimationClipProperty = require('AnimationClipProperty');
const ANIM_COMPONENT_PROPERTY = 'animation';

const DataTemplateLabel = require('DataTemplateLabel');
const DooberComponent = require('DooberComponent');

const PRODUCT_PACKAGE_TYPE = 'ProductPackageItemMissionPoints';

const DOOBER_MAX = 100;

// Override the animation component property to include a new animation state
const animPropertyDefinition = AnimationClipProperty.ccAnimationForProperties(
	ANIM_COMPONENT_PROPERTY,
	[
		'intro',
		'transition',
		'outro',
		'pointsProgress',
	],
	[
		'Animation component for overall reward sequence animation states (optional)',
		'Adding this component will reveal states for intro, transition, and outro',
	].join('\n')
);
animPropertyDefinition.override = true;

cc.Class({
	extends: MissionRewardSequence,
	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Rewards/Sequence/Points Reward Sequence',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	properties: {
		// Property name must match ANIM_COMPONENT_PROPERTY
		animation: animPropertyDefinition,

		// Points properties
		pointsProgress: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for incrementing points'
		),

		progressDisplay: {
			default: 1,
			type: 'Float',
			range: [0, 1, 0.1],
			slide: true,
			tooltip: 'Progress relative to the start and end point values. This should almost always animate from 0 to 1',
			notify() {
				// Trigger an update that will refresh the displayed point value
				// this._updatePoints();
			},
		},

		pointsDoobers: {
			default: null,
			type: DooberComponent,
			tooltip: "Doobers for showing points going to the points wallet",
		},

	},


	setRewardsFromProductPackage(rewardItems) {
		this._super(rewardItems);
		if(!!this._productPackage[PRODUCT_PACKAGE_TYPE]){
			let pointsEarned = 0;
			this._productPackage[PRODUCT_PACKAGE_TYPE].forEach(function(reward){
				pointsEarned += +reward.amount;
			});
			this._pointsEarned = +pointsEarned;
			this._currentPoints = 0;
		}
	},
	
	/*
	setCurrentPoints(currentPoints) {
		this._currentPoints = currentPoints;
		this._updatePoints();
	},

	_updatePoints() {
		if (this._currentPoints == null) {
			this.log.e("Cannot update points, command data has not been initialized");
			return;
		}

		let displayPointValue;
		if (this._to == null || this._from == null) {
			// No animation transition configured, use current point value
			displayPointValue = this._currentPoints;
		} else {
			// Interpolate between configured start and end point values
			displayPointValue = this._from + (this._to - this._from) * this.progressDisplay;
		}
		this._updateLabels(Math.floor(displayPointValue));
	},

	_updateLabels(displayPointValue) {
		if (this.pointsLabels.length === 0) {
			return;
		}
		if (this._labelPointValue === displayPointValue) {
			// No change
			return;
		}
		this._labelPointValue = displayPointValue;

		const labelTemplateData = {
			currentPoints: displayPointValue,
			earnedPoints: this._pointsEarned || 0,
		};
		// Set label values
		this.pointsLabels.forEach((pointsLabel) => {
			if (CC_EDITOR) {
				pointsLabel.testData = JSON.stringify(labelTemplateData, null, '\t');
			}
			pointsLabel.setData(labelTemplateData);
		});
	},
	*/

	startDooberSequence: function(){
		if (this.pointsDoobers) {
			this.pointsDoobers.totalParticles = Math.min(this._pointsEarned, DOOBER_MAX);
		}
		this.progressDisplay = 0;
		this._from = this._currentPoints;
		this._to = this._currentPoints + this._pointsEarned;
		return this.pointsProgress.play();
	},

	playSequence: function(){
		const superParent = this._super;
		return this.startDooberSequence()
		.then(() => {
			if (this._hasPoints) {
				// Reset point transition values
				this._currentPoints = this._to;
				this._to = this._from = null;
				this._hasPoints = false;
				this._pointsEarned = 0;
				this.progressDisplay = 1;
			}
			// Play standard reward sequence if there are other items rewarded

			if (this.hasItems()) {
				/*
				 * We cannot use the standard flow of just calling this._super for MissionRewardSequence::playSequence
				 * Inside of a promise, this object will lose it's definition of _super. We need a separate reference
				 * to call explicitly with the correct context
				 */
				return superParent.call(this);
			}
		});
	},
});
