const BaseMissionComponent = require('BaseMissionComponent');
const CountdownComponent = require('CountdownComponent');

cc.Class({
	extends: BaseMissionComponent,
	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Countdown Timer',
		requireComponent: CountdownComponent,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SPP/pages/562659403/Mission+Countdown+Component',
	},

	onUpdateMissionData: function() {
		this._countdownView = this.getComponent('CountdownComponent');
		const secondsRemaining = this.missionInterface.getSecondsRemaining();

		if (secondsRemaining) {
			this._endTime = Date.now() + secondsRemaining * 1000;
			this._countdownView.setEndTime(this._endTime);
		}
	},

});