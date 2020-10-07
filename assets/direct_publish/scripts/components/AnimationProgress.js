const AnimationState = require('AnimationState');

const clampPercent = function(num) {
	return Math.max(Math.min(num, 1), 0);
};

// Progress bar component for use in cc.Animations
// The cc.Anim should tween the progress value of this commponent between 0 and 1 when the progress bar should update
// This will update the cc.ProgressBar with a value relative to the start and end progress targets provided from setupProgress
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		executeInEditMode: true,
	},
	properties: {
		progress: {
			default: 0,
			type: 'Float',
			range: [0, 1, 0.1],
			slide: true,
			tooltip: 'Progress relative to the start and end values. Designed to be used as a key for ccAnims. This should almost always animate from 0 to 1',
			animatable: true,
			notify(){
				this._updateProgress(this.progress);
			},
		},
		progressBar: {
			default: null,
			type: cc.ProgressBar,
			tooltip: 'Progress bar to update fill as the animation is happening',
		},
		progressLabel: {
			default: null,
			type: cc.Label,
			tooltip: 'Progress label to update progress as the animation is happening i.e. 1/100',
		},
		from: {
			default: 0,
			type: 'Integer',
			tooltip: 'Preview value for starting progress amount',
		},
		to: {
			default: 100,
			type: 'Integer',
			tooltip: 'Preview value for ending progress amount',
		},
		total: {
			default: 100,
			type: 'Integer',
			tooltip: 'Preview value for total progress',
		},
		completeState: {
			default: function() {
				return new AnimationState();
			},
			type: AnimationState,
		},
	},

	setupProgress(fromValue, toValue, total) {
		this.from = Math.floor(fromValue);
		this.to = Math.floor(toValue);
		this.total = Math.floor(total);
		this.progress = 0;
		this._hasCompleted = false;
	},

	// percent = percentage through animating progress 0 - 1
	_updateProgress(percent) {
		this._updateBar(percent);
		this._updateLabel(percent);
		this._updateAnimation(percent);
	},

	_updateBar(percent) {
		if (!this.progressBar) {
			return;
		}
		const progress = (this.from + (this.to - this.from) * percent) / this.total;
		this.progressBar.progress = clampPercent(progress);
	},

	_updateLabel(percent) {
		if (!this.progressLabel) {
			return;
		}
		const current = Math.floor(this.from + (this.to - this.from) * percent);
		this.progressLabel.string = current + '/' + this.total;
	},

	_updateAnimation(percent) {
		if (CC_EDITOR) {
			// Ignore animation component updates in the editor
			return;
		}
		if (this._hasCompleted || this.progress === 0) {
			return;
		}
		const current = Math.floor(this.from + (this.to - this.from) * percent);
		if (current >= this.total) {
			this._hasCompleted = true;
			this.completeState.playAdditive();
		}
	},
});
