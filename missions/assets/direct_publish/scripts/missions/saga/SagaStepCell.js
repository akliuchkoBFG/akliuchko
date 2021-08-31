const TableViewCell = require('TableViewCell');
const MissionStepInterface = require('MissionStepInterface');
const ScrollViewContentAnimation = require('ScrollViewContentAnimation');

const TAG = "SagaStepCell";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: TableViewCell,
	mixins: [ComponentLog],

	editor: {
		menu: 'Add Mission Component/Saga/Step Cell',
		disallowMultiple: true,
	},

	properties: {
		stepInterface: {
			default: null,
			type: MissionStepInterface,
			tooltip: "Reference to the mission step interface for this step prefab",
		},

		scrollAnimation: {
			default: null,
			type: ScrollViewContentAnimation,
			tooltip: "(optional) Reference to a scrolling animation controller to hook this cell up to a scroll view",
		}
	},

	// cellData = {
	// 	stepID
	// 	missionInterface
	// 	pageView
	// };
	updateCellData(data) {
		try {
			if (this.stepInterface) {
				this.stepInterface.missionInterface = data.missionInterface;
				this.stepInterface.stepID = data.stepID;
			} else {
				this.log.w("Step interface not configured in table view cell");
			}
		} catch(e) {
			this.log.e(e.message);
		}
	},


	// Recycle callback for pulling cell from prefab pool, initialize prefab where necessary
	reuse() {
		if (this.scrollAnimation) {
			// Disable scroll animation until the scroll animation controller setup
			// This ensures errant prefab edits do not generate runtime error logs for this component
			this.scrollAnimation.enabled = false;
		}
	},

	// Recycle callback for putting cell into prefab pool, reset references that should not persist
	unuse() {
		if (this.stepInterface) {
			this.stepInterface.missionInterface = null;
		}
		if (this.scrollAnimation) {
			this.scrollAnimation.enabled = false;
			this.scrollAnimation.scrollView = null;
		}
	},
});
