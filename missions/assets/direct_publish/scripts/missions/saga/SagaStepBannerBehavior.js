const BaseMissionStepComponent = require('BaseMissionStepComponent');
const SagaStepBase = require('SagaStepBase');
const SagaStepZoneReward = require('SagaStepZoneReward');

const TAG = 'SagaBannerBehavior';
const ComponentLog = require('ComponentSALog')(TAG);

/*
 * SagaStepBannerBehavior controls how the saga banner will be revealed, either by a click
 * event or when a pillar's page is focused.
 */
cc.Class({
	extends: BaseMissionStepComponent,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Saga/SagaStepBannerBehavior'
	},

	properties: {
		sagaStep:{
			default: null,
			type: SagaStepBase,
			tooltip: 'Set this reference for saga step prefabs',
		},
	},


	// use this for initialization
	onLoad: function () {
		if (this.sagaStep) {
			this.sagaStep.on('saga.step-change', this.bannerOnScroll, this);
			this.sagaStep.on('saga-step.unlocked', this.bannerOnUnlock, this);
			this.sagaStep.on('saga-step.reset-to-locked', this._closeImmediate, this);
		} else {
			this.log.d("Saga step not configured, banner scroll behaviors are not active");
		}

		this._isInitialized = false;
		this._bannerOpen = false;
	},

	onUpdateMissionStepData: function() {
		if (CC_EDITOR) {
			return;
		}
		const activeIDs = this.missionStepInterface.missionInterface.getActiveStepIDs();
		if (activeIDs.length !== 1) {
			this.log.e('SagaStepBannerBehavior is not valid for parallel missions');
			return;
		}
		const bannerState = this.missionStepInterface.getState();
		if (!this._isInitialized) {
			this._isInitialized = true;
			if (bannerState === "active") {
				this._openBanner();
			}
		}
	},

	bannerOnClick: function() {
		const bannerState = this.missionStepInterface.getState();
		// LOCKED and COMPLETE state support opening and closing banner on click
		if (!this._bannerOpen && (bannerState === "locked" || bannerState === "redeemed")) {
			this._openBanner();
		} else if (this._bannerOpen && (bannerState === "locked" || bannerState === "redeemed")) {
			this._closeBanner();
		}
	},

	bannerOnScroll: function(event) {
		const isCurrentPageActiveStep = +event.detail.stepID === +this.missionStepInterface.stepID;
		if (!this._bannerOpen && isCurrentPageActiveStep && this.missionStepInterface.getState() === "active") {
			// In ACTIVE state, banner should open when scrolled to.
			this._openBanner();
		} else if (this._bannerOpen && !isCurrentPageActiveStep) {
			// Always close banner when scrolling away
			this._closeBanner();
		}
	},

	bannerOnUnlock() {
		// Always open the banner when unlocking a step node
		if (!this._bannerOpen) {
			this._openBanner();
		}
	},

	_openBanner: function(){
		this._bannerOpen = true;
		this.emit('banner.open');
	},

	_closeBanner: function(){
		this._bannerOpen = false;
		this.emit('banner.close');
	},

	_closeImmediate() {
		this._bannerOpen = false;
		this.emit('banner.close-immediate');
	},
});
