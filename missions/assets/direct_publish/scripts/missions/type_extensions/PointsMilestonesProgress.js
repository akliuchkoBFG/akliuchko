const TAG = "PointsMilesonesProgress";
const ComponentLog = require('ComponentSALog')(TAG);

const BaseMissionComponent = require('BaseMissionComponent');
const DataTemplateLabel = require('DataTemplateLabel');

const clampPercent = function(num) {
	return Math.max(Math.min(num, 1), 0);
};

// Command data payload sections
const COMMAND_DATA_KEY_POINTS = 'points';
const COMMAND_DATA_KEY_MILESTONES = 'pointsMilestones';

// Data keys within command data chunks
const KEY_CURRENT_POINTS = 'current';
const KEY_MILESTONE_AWARDS = 'milestoneAwards';
const KEY_POINTS_REQUIRED = 'pointsRequired';

cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Type Extensions/Points Milestones Progress',
	},

	properties: {
		progressDisplay: {
			default: 1,
			type: 'Float',
			range: [0, 1, 0.1],
			slide: true,
			tooltip: 'Progress relative to the start and end point values. This should almost always animate from 0 to 1',
			notify() {
				// Trigger an update that will refresh the displayed point value
				this._updatePoints();
			},
		},

		// Progress bar properties
		fillSprite: {
			default: null,
			type: cc.Sprite,
			tooltip: "Sprite to render the progress bar. Sprite should use type FILLED",
		},
		milestoneEndPoints: {
			default: [],
			type: [cc.Float],
			tooltip: "Percent decimal values (0-1) for each milestone marker in the overall progress bar",
		},

		// Label Properties
		pointsLabels: {
			default: [],
			type: [DataTemplateLabel],
			tooltip: [
				"Template label for populating points information",
				"Available variables: {currentPoints}, {nextMilestonePoints}, {totalPoints}, and {milestone#} where # is 1-total_milestones",
			].join('\n'),
		},
	},


	_updatePoints() {
		if (this._currentPoints == null) {
			this.log.e("Cannot update milestone progress, command data has not been initialized");
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
		this._updateBar(displayPointValue);
		this._updateLabels(Math.floor(displayPointValue));
	},

	_updateBar(displayPointValue) {
		if (!this.fillSprite) {
			return;
		}

		const progress = this._getProgressPercentForPoints(displayPointValue);
		this.fillSprite.fillRange = progress;
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

		const segmentProperties = this._getSegmentPropertiesForPoints(displayPointValue);
		const totalPoints = this._milestonesPointsRequired[this._milestonesPointsRequired.length - 1];
		const labelTemplateData = {
			currentPoints: displayPointValue,
			nextMilestonePoints: segmentProperties.segmentEnd,
			totalPoints,
		};
		// Add data for each individual milestone (keys: milestone1-milestone[length])
		for (var i = 1; i <= this._milestonesPointsRequired.length; i++) {
			const milestonePoints = this._milestonesPointsRequired[i - 1];
			labelTemplateData['milestone' + i] = milestonePoints;
		}
		// Set label values
		this.pointsLabels.forEach((pointsLabel) => {
			if (CC_EDITOR) {
				pointsLabel.testData = JSON.stringify(labelTemplateData, null, '\t');
			}
			pointsLabel.setData(labelTemplateData);
		});
	},

	// Update progress variables whenever the command data is updated and call into the bar update
	onUpdateMissionData() {
		const pointsCommandData = this.missionInterface.getMissionCommandData(COMMAND_DATA_KEY_POINTS);
		const milestonesCommandData = this.missionInterface.getMissionCommandData(COMMAND_DATA_KEY_MILESTONES);
		this._currentPoints = pointsCommandData[KEY_CURRENT_POINTS];
		this._milestonesPointsRequired = milestonesCommandData[KEY_MILESTONE_AWARDS].map((milestoneAward) => {
			return milestoneAward[KEY_POINTS_REQUIRED];
		});
		if (this._milestonesPointsRequired.length !== this.milestoneEndPoints.length) {
			this.log.w("Mismatch in number of milestones and number of editor configured milestone end points, this could be a visual bug");
		}
		// TODO: evaluate if this is still reasonable to do if there's a point transition configured
		if (this.progressDisplay >= 1) {
			this._updatePoints();
		}
	},

	setupProgressTransition(finalValue) {
		this._from = this._currentPoints;
		this._to = finalValue;
		this.progressDisplay = 0;
	},

	// Calculate the overall progress bar percent based on a specific point value by determining which segment the point value falls within
	_getProgressPercentForPoints(points) {
		if (!this._milestonesPointsRequired) {
			this.log.e("Unknown milestone point thresholds");
			return 0;
		}

		const {segmentIndex, segmentStart, segmentEnd} = this._getSegmentPropertiesForPoints(points);
		let segmentPercent = 1;
		if (segmentStart !== segmentEnd) {
			// Calculate percent within the segment
			segmentPercent = (points - segmentStart) / (segmentEnd - segmentStart);
		}
		segmentPercent = clampPercent(segmentPercent);

		// Translate to overall progress bar percentage
		const start = this._getStartPoint(segmentIndex);
		const end = this._getEndPoint(segmentIndex);
		const progressPercent = clampPercent(start + segmentPercent * (end - start));
		return progressPercent;
	},

	// Helpers for getting segment bounds
	_getStartPoint: function(segmentIndex) {
		if (segmentIndex > 0) {
			return this._getEndPoint(segmentIndex - 1);
		}
		return 0;
	},
	_getEndPoint: function(segmentIndex) {
		if (segmentIndex >= this.milestoneEndPoints.length) {
			return 1;
		}
		return this.milestoneEndPoints[segmentIndex];
	},

	_getSegmentPropertiesForPoints(points) {
		let segmentStart = 0, segmentEnd = 0, segmentIndex;
		for (segmentIndex = 0; segmentIndex < this._milestonesPointsRequired.length; segmentIndex++) {
			segmentEnd = this._milestonesPointsRequired[segmentIndex];
			if (points >= segmentStart && points < segmentEnd) {
				// Found the correct segment for this point value
				break;
			}
			// Use the end of the current segment as the start of the next
			segmentStart = segmentEnd;
		}
		return {
			segmentIndex,
			segmentStart,
			segmentEnd,
		};
	},
});
