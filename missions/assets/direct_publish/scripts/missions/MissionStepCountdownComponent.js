const BaseMissionStepComponent = require('BaseMissionStepComponent');
const CountdownComponent = require('CountdownComponent');
const TAG = "MissionStepCountdownComponent";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
	extends: BaseMissionStepComponent,
	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Time-Lock Step Countdown Timer',
		requireComponent: CountdownComponent,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/4065689693/Mission+Step+Countdown+Component',
	},

	properties: {
		preUnlockTitle: {
			default: 'Unlocks',
			tooltip: "Title of Countdown Timer before step is unlocked",
		},
		preExpireTitle: {
			default: 'Expires',
			tooltip: "Title of Countdown Timer before step expires",
		},
		postExpireTitle: {
			default: 'Expired',
			tooltip: "Title of Countdown Timer after step expires",
		},
		titleLabel: {
			type: cc.Label,
			tooltip: "Title Label of Countdown Timer",
			default: null,
		},
	},

	onUpdateMissionStepData() {
		this._secondsRemaining = this.missionStepInterface.getSecondsRemaining();
		if (typeof this._secondsRemaining === 'undefined') {
			return;
		}
		this._secondsToUnlock = this.missionStepInterface.getSecondsToUnlock();
		this._countdownView = this.getComponent('CountdownComponent');
		this.updateDisplay();

	},

	updateDisplay() {
		let title = "";
		if (this._secondsToUnlock > 0) {
			this._endTime = Date.now() + this._secondsToUnlock * 1000;
			this._countdownView.setEndTime(this._endTime);
			title = this.preUnlockTitle;
		} else if (this._secondsRemaining > 0) {
			this._endTime = Date.now() + this._secondsRemaining * 1000;
			this._countdownView.setEndTime(this._endTime);
			title = this.preExpireTitle;
		} else {
			this._endTime = Date.now();
			this._countdownView.setEndTime(this._endTime);
			title = this.postExpireTitle;
		}
		if (this.titleLabel) {
			this.titleLabel.string = title;
		}

	},

	onTimerFinished() {
		if (this._secondsToUnlock > 0) {
				this._secondsRemaining -= this._secondsToUnlock;
				this._secondsToUnlock = 0;
				this._countdownView.paused = false;
				this.updateDisplay();
		} else if (this._secondsRemaining > 0) {
				this._secondsRemaining = 0;
				this._countdownView.paused = false;
				this.updateDisplay();
		}
	},

});