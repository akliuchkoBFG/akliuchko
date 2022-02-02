const TableViewCell = require('TableViewCell');
const MissionStepInterface = require('MissionStepInterface');
const MissionTextConfiguration = require('MissionTextConfiguration');

const TAG = "MissionStepCell";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: TableViewCell,
	mixins: [ComponentLog],

	editor: {
		// Re-evaluate if this ever gets used without being subclassed
		// menu: 'Missions/Miscellaneous/Table View Step Cell',
		disallowMultiple: true,
	},

	properties: {
		stepInterface: {
			default: null,
			type: MissionStepInterface,
			tooltip: "Reference to the mission step interface for this step prefab",
		},
	},

	// cellData = {
	// 	stepID
	// 	missionInterface
	// 	textConfiguration (optional)
	// };
	updateCellData(data) {
		try {
			// If a text configuration component is provided configure step descriptions to point at the global configuration
			if (data.textConfiguration instanceof MissionTextConfiguration) {
				const stepDescriptions = this.getComponentsInChildren('MissionStepDescriptionLabel');
				stepDescriptions.forEach((stepDescription) => {
					stepDescription.textConfiguration = data.textConfiguration;
				});
			}
			// Connect step interface to mission and target step
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

	// Recycle callback for putting cell into prefab pool, reset references that should not persist
	unuse() {
		if (this.stepInterface) {
			this.stepInterface.missionInterface = null;
			this.stepInterface._isInitialized = false;
		}
	},
});
