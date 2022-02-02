var CountdownFinishAction = cc.Enum({
	NONE: 0,
	CLOSE: 1,
	METRICS: 2,
	ADVANCED: 3,
});

// Can't find anything about stringifying an enum, so this will do for now
var EventMap = ["", "closeEvent", "metricsEvent", ""];

cc.Class({
	extends: cc.Component,
	editor: {
		// To avoid confusion with components that set a countdown from scene data, do not set menu path
		disallowMultiple: true,
		requireComponent: cc.Label,
	},
	properties: {

		hours: {
			default: 4,
			type: cc.Integer,
			min:0,
			notify: function(){ this._editorDisplay(); }
		},
		minutes: {
			default: 4,
			type: cc.Integer,
			range:[0, 59, 1],
			notify:function(){ this._editorDisplay(); }
		},
		seconds:{
			default: 59,
			type: cc.Integer,
			range:[0, 59, 1],
			notify:function(){ this._editorDisplay(); }
		},
		finishedAction:{
			default: 0,
			type: CountdownFinishAction,
			notify: function(){ this._generateEventHandler();},
			tooltip: "Action to call when timer finishes"
		},
		onFinished: {
			default: [],
			visible: function() { return this.finishedAction === CountdownFinishAction.ADVANCED; },
			type: cc.Component.EventHandler,
			tooltip: "[advanced] Event that will be called when the duration reaches 0",
		},

	},

	onLoad: function () {
		this._label = this.getComponent(cc.Label);
		if (this._endTime) {
			// Already configured with an end time when it loaded
			return;
		}
		var duration = (this.hours * 60 * 60 + this.minutes * 60 + this.seconds) * 1000;
		this.setDuration(duration);
		this.paused = false;
	},

	update: function (dt) {
		if(this.paused){
			return;
		}

		this._currentTime = Date.now();
		var remaining = this.getTimeRemaining();
		this._label.string = this._formatTime(remaining);
		if (remaining === 0 && this.onFinished) {
			this.paused = true;
			cc.Component.EventHandler.emitEvents(this.onFinished, null);
		}
	},

	setDuration: function(millis) {
		this._startTime = Date.now();
		this._endTime = this._startTime + millis;
		this._currentTime = this._startTime;
	},

	setEndTime: function(millis) {
		this._startTime = Date.now();
		this._endTime = millis;
		this._currentTime = this._startTime;
	},

	getTimeRemaining: function() {
		return Math.max(0, this._endTime - this._currentTime);
	},

	_editorDisplay: function(){
		var duration = (this.hours * 60 * 60 + this.minutes * 60 + this.seconds) * 1000;
		this.getComponent(cc.Label).string = this._formatTime(duration);
	},

	_formatTime: function(millis) {
		var seconds = Math.floor(millis / 1000);
		var day = Math.floor(seconds / (24 * 60 * 60));
		var months = 0;
		if(day < 0){
			day = 0;
		} else if (day > 30) {
			// Approximate one month as 30 days
			months = Math.floor(day / 30);
		}
		seconds -= day * 24 * 60 * 60;
		var hour = Math.floor(seconds / (60 * 60));
		if(hour < 0){
			hour = 0;
		}
		seconds -= hour * 60 * 60;
		var minute =  Math.floor(seconds / 60);
		if(minute < 0){
			minute = 0;
		}
		seconds -= minute * 60;
		// Display >N months for times > 30 days
		if (months > 0) {
			return '>' + months + " month" + ((months > 1) ? "s" : "");
		}
		// Display days for times > 24 hours
		if (day > 0) {
			return day + " day" + ((day > 1) ? "s" : "");
		}
		// Display HH:MM:SS for times < 24 hours
		var temp = "";
		temp += ((hour < 10) ? '0' : '') + hour;
		temp += ((minute < 10) ? ':0' : ':') + minute;
		temp += ((seconds < 10) ? ':0' : ':') + seconds;
		return temp;
	},

	closeEvent: function(){
		SADispatchObject.performAction('close', {});
	},

	metricsEvent: function(){
		/*
		// For demonstration purposes only right now. 
		SAMetrics.sendBatchedEvent({eventName:'TimerTimedOut', jsonData: {
			startTime:(this.startTime),
			name: this.name,
		}});
		*/
		SADispatchObject.performAction('close', {});
	},

	_generateEventHandler: function() {
		switch(this.finishedAction) {
			case CountdownFinishAction.NONE:
				this.onFinished = [];
				break;
			case CountdownFinishAction.CLOSE:
			case CountdownFinishAction.METRICS:
				const clickEvent = new cc.Component.EventHandler();
				clickEvent.target = this.node;
				clickEvent.component = this.__classname__;
				clickEvent.handler = EventMap[this.finishedAction];
				this.onFinished = [clickEvent];
				break;
			case CountdownFinishAction.ADVANCED:
				break;
		}
	}
});
