const MissionStepCell = require('MissionStepCell');
const ScrollViewContentAnimation = require('ScrollViewContentAnimation');

const TAG = "SagaStepCell";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: MissionStepCell,
	mixins: [ComponentLog],

	editor: {
		menu: 'Missions/Types/Saga/Step Cell',
		disallowMultiple: true,
	},

	properties: {
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
		this._super(data);
		// No special logic currently required for initializing a saga step cell over a standard mission step cell
		// The unique scroll animation piece of a saga step is managed primarily through the ScrollViewContentAnimationController
		// The logic here for the scrollAnimation property is purely to manage the component through table view cell lifecycle
	},


	// Recycle callback for pulling cell from prefab pool, initialize prefab where necessary
	reuse() {
		this._super();
		if (this.scrollAnimation) {
			// Disable scroll animation until the scroll animation controller setup
			// This ensures errant prefab edits do not generate runtime error logs for this component
			this.scrollAnimation.enabled = false;
		}
	},

	// Recycle callback for putting cell into prefab pool, reset references that should not persist
	unuse() {
		if (this.scrollAnimation) {
			this.scrollAnimation.enabled = false;
			this.scrollAnimation.scrollView = null;
		}
		this._super();
	},
});
