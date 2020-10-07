const PCABaseComponent = require('PCABaseComponent');

const ProgressBarOrientation = cc.Enum({
	VERTICAL: 0,
	HORIZONTAL: 1,
});

const ProgressBarType = cc.Enum({
	MOVE: 0,
	SCALE: 1,
});

cc.Class({
	extends: PCABaseComponent,
	editor: CC_EDITOR && {
		menu: 'Add PCA Component/Animated Progress Bar',
	},

	properties: {
		completeBarNode: {
			default: null,
			type: cc.Node,
		},
		fillBarNode: {
			default: null,
			type: cc.Node,
		},
		particleContainer: {
			default: null,
			type: cc.Node,
		},
		fillType: {
			default: ProgressBarType.MOVE,
			type: ProgressBarType,
			tooltip: 'Fill animation type',
		},
		orientation: {
			default: ProgressBarOrientation.VERTICAL,
			type: ProgressBarOrientation,
			tooltip: 'Orientation of the meter',
		},
		reversed: {
			default: false,
			tooltip: 'Is the direction of the meter reversed',
		},
		meterFillDelay: {
			default: 0,
			tooltip: 'Delay in seconds before the meter starts filling up. Allow time for particles to drop',
		},
		spineAnimation: {
			default: null,
			type: sp.Skeleton,
		},
		activeAnimation: {
			default: 'active',
			displayName: 'Active Animation',
			tooltip: 'Animation to play when the bar finishes',
			visible: function() { return this.spineAnimation; },
		},
		idleAnimation: {
			default: 'idle',
			tooltip: 'Idle Animation to play after the active animation (reset)',
			visible: function() { return this.spineAnimation; },
		},
	},

	onLoad: function () {
		this._spinsPerEntry = this._loadData.spinsPerEntry;
		this._numSpins = this._loadData.numEntries;

		// Setup View
		this._selectCurrentBar();
		this.fillType ? this._setScaleOrientationValues() : this._setMoveOrientationValues();
		this._getParticles();
	},

	start: function() {
		if (this._getFillPercentage() > 0) {
			this._startParticles();
			this._playSequenceOnNode(this._currentBar, this._createMeterSequence());
		}
	},

	_selectCurrentBar: function() {
		this._currentBar = this.fillBarNode;
		if (!this.completeBarNode) {
			return;
		}

		var isFull = this._numSpins === this._spinsPerEntry;
		this.completeBarNode.active = isFull;
		this.fillBarNode.active = !isFull;

		if (isFull) {
			this._currentBar = this.completeBarNode;
		}
	},

	_playSequenceOnNode: function(node, seqArr) {
		if (seqArr.length) {
			var seq = cc.sequence(seqArr);
			node.runAction(seq);
		}
	},

	_createMeterSequence: function() {
		var meterSeq = [];

		// wait for sprinkle particles to hit bottom first
		meterSeq.push(cc.delayTime(this.meterFillDelay));

		// fill meter with carryover spins
		if (this.fillType) {
			var fillAction = cc.scaleTo(this._getAdjustedMoveTime(), this._horizontalFill, this._verticalFill);
		} else {
			var fillAction = cc.moveBy(this._getAdjustedMoveTime(), this._horizontalFill, this._verticalFill);
		}
		meterSeq.push(fillAction);

		// functions called after meter is done filling up
		var stopParticlesFunc = cc.callFunc(this._stopParticles, this);
		meterSeq.push(stopParticlesFunc);

		var startSpineFn = cc.callFunc(this._startSpineAnim, this);
		meterSeq.push(startSpineFn);
		return meterSeq;
	},
	_startSpineAnim: function() {
		if(!this.spineAnimation){
			return;
		}
		if (this.spineAnimation.animation !== this.activeAnimation) {
			this.spineAnimation.setAnimation(0, this.activeAnimation, false);
			this.spineAnimation.addAnimation(0, this.idleAnimation, true);
		}
	},


	_getFillPercentage: function() {
		return this._numSpins / this._spinsPerEntry;
	},

	_getAdjustedMoveTime: function() {
		return this._getFillPercentage() > .25 ? 2 : 1;
	},

	_setMoveOrientationValues: function() {
		var directionMultiplier = this.reversed ? -1 : 1;

		if (this.orientation) {
			this._horizontalFill = directionMultiplier * this._currentBar.width * this._getFillPercentage();
			this._verticalFill = 0;
			this._adjustFillBarPosition();
		} else {
			this._horizontalFill = 0;
			this._verticalFill = directionMultiplier * this._currentBar.height * this._getFillPercentage();
			this._adjustFillBarPosition();
		}
	},

	_setScaleOrientationValues: function() {
		var anchorValue = this.reversed ? 1 : 0;

		if (this.orientation) {
			this._horizontalFill = this._getFillPercentage();
			this._verticalFill = 1;
			this._currentBar.setAnchorPoint(anchorValue, 0.5);
			this._adjustFillBarPosition();
			this._currentBar.setScale(0, 1);
		} else {
			this._horizontalFill = 1;
			this._verticalFill = this._getFillPercentage();
			this._currentBar.setAnchorPoint(0.5, anchorValue);
			this._adjustFillBarPosition();
			this._currentBar.setScale(1, 0);
		}
	},

	_adjustFillBarPosition: function() {
		var positionMultiplier = this.reversed ? 1 : -1;
		var adjustmentRatio = this.fillType ? 2 : 1;

		if (this.orientation) {
			this._currentBar.setPosition(this._currentBar.x + positionMultiplier * (this._currentBar.width/adjustmentRatio), this._currentBar.y);
		} else {
			this._currentBar.setPosition(this._currentBar.x, this._currentBar.y + positionMultiplier * (this._currentBar.height/adjustmentRatio));
		}
	},

	_getParticles: function() {
		this._particles = this.node.getComponentsInChildren(cc.ParticleSystem);
		if (this.particleContainer) {
			this._particles = this.particleContainer.getComponentsInChildren(cc.ParticleSystem);
		}
	},

	_startParticles: function() {
		_.invoke(this._particles, 'resetSystem');
	},

	_stopParticles: function() {
		_.invoke(this._particles, 'stopSystem');
	},

});