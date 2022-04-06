const NotificationCondition = require('NotificationCondition');
const Comparator = require('Comparator');
const ComparisonEnum = Comparator.enumForComparators(['>', '<']);

cc.Class({
	extends: NotificationCondition,

	editor: CC_EDITOR && {
		menu: 'Add Notification Component/Condition/Mission Time Remaining',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	properties: {
		secondsRemaining: {
			default: 0,
			tooltip: 'Comparison value for number of seconds remaining in the mission. e.g. "Current Time Remaining" < "Seconds Remaining"',
		},
		comparison: {
			default: ComparisonEnum['<'],
			type: ComparisonEnum,
		},
	},

	shouldSchedule(missionData) {
		// Ensure relevant data was provided
		if (!missionData || missionData.secondsRemaining == null) {
			this.log.w('Unexpected data format');
			return false;
		}

		return Comparator.doComparison(this.comparison, missionData.secondsRemaining, this.secondsRemaining);
	},
});
