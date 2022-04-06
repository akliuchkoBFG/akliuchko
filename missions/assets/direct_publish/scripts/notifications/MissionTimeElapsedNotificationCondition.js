const NotificationCondition = require('NotificationCondition');
const Comparator = require('Comparator');
const ComparisonEnum = Comparator.enumForComparators(['>', '<']);

cc.Class({
	extends: NotificationCondition,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Condition/Mission Time Elapsed',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		secondsElapsed: {
			default: 0,
			tooltip: 'Comparison value for number of seconds elapsed in the mission. e.g. "Current Time Elapsed" < "Seconds Elapsed"',
		},
		comparison: {
			default: ComparisonEnum['<'],
			type: ComparisonEnum,
		},
	},

	shouldSchedule(missionData) {
		// Ensure relevant data was provided
		if (!missionData || missionData.secondsActive == null) {
			this.log.w('Unexpected data format');
			return false;
		}

		return Comparator.doComparison(this.comparison, missionData.secondsActive, this.secondsElapsed);
	},
});
