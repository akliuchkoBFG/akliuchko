const MissionStepButton = require('MissionStepButton');

cc.Class({
	extends: MissionStepButton,

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Play Button',
		requireComponent: cc.Button,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/510984384/Mission+Step+Play+Button'
	},

	properties: () => ({
		buyInID: {
			type: cc.Integer,
			default: 655,
			visible: false,
		},
		index: {
			type: cc.Integer,
			default: 0,
			tooltip: "The index of the buyInID from the list of availableBuyInIDs below that the button should use"
		},
		availableBuyInIDs: {
			multiline: true,
			readOnly: true,
			tooltip: "The list of avaliable buyInIDs for launching a slot machine",
			get() { 
				const buyInIDs = this.missionStepInterface.getBuyInIDs() || [];
				return buyInIDs.join('\n');
			}
		}
	}),

	performMissionStepAction: function() {
		if (this.buyInID) {
			this.missionStepInterface.launchSlot(this.buyInID);
		}
	},

	onUpdateMissionStepData: function() {
		if (this.missionStepInterface) {
			const buyInIDs = this.missionStepInterface.getBuyInIDs();
			if (buyInIDs && buyInIDs.length > 0) {
				if (buyInIDs.length > this.index) {
					this.buyInID = buyInIDs[this.index];
				} else {
					this.buyInID = buyInIDs[0];
					this.log.w('CTA buyInID index ' + this.index + ' is not available, using buyInID ' + this.buyInID);
				}
			} else {
				// null out the buyin id so we don't attempt to launch slot w/ bad data
				this.buyInID = 0;
			}
		}
	}
});
