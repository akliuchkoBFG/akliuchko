const BaseMissionStepComponent = require('BaseMissionStepComponent');

const TAG = "SagaController";
const ComponentLog = require('ComponentSALog')(TAG);

const BetterPageView = require('BetterPageView');
const SagaZoneGroup = require('SagaZoneGroup');
const TableView = require('TableView');
const SagaZoneAsset = require('SagaZoneAsset');
const SagaStep = require('SagaStep');
const SagaStepZoneReward = require('SagaStepZoneReward');
const AnimationClipProperty = require('AnimationClipProperty');
const MissionRewardSequence = require('MissionRewardSequence');
const SagaZoneTransition = require('SagaZoneTransition');
const MissionInfoController = require('MissionInfoController');
const MissionTextConfiguration = require('MissionTextConfiguration');

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
	'stepComplete',
	'stepClaim',
	'stepOutro',
	'missionComplete',
];

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		menu: 'Missions/Types/Saga/Controller',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		executeInEditMode: false,
	},

	mixins: [ComponentLog, cc.EventTarget],

	properties: {
		pageView: {
			default: null,
			type: BetterPageView,
			tooltip: 'Reference to the page view that holds the step nodes',
		},
		scrollDuration: {
			default: 0.5,
			tooltip: 'Per-page duration (in seconds) to animate between steps when scrolling automatically',
		},
		tableView: {
			default: null,
			type: TableView,
			tooltip: 'Reference to the table view that creates step nodes',
		},
		textConfiguration: {
			default: null,
			type: MissionTextConfiguration,
			tooltip: 'Global text configuration to use with daily mission step prefabs',
		},
		stepClaimSequence: {
			default: null,
			type: MissionRewardSequence,
			tooltip: 'Reference to the normal reward sequence used for claiming an individual step reward',
		},
		zoneClaimSequence: {
			default: null,
			type: MissionRewardSequence,
			tooltip: 'Reference to the special reward sequence used for claiming the zone reward',
		},
		zones: {
			default: [],
			type: [SagaZoneGroup],
			tooltip: 'Zone configuration for step prefabs. Zones will be repeated if there are more sections to the missions than zones configured here',
		},
		zoneAssets: {
			default: [],
			type: [SagaZoneAsset],
			tooltip: 'Assets that swap per zone outside of the step prefabs',
		},

		// Animation component for anim states. Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Animation component for mission and step animation choreography',
				'Adding this component will reveal states for stepComplete, stepClaim, stepOutro, and missionComplete',
			].join('\n')
		),

		// Animation states
		stepComplete: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for when a step is complete'
		),
		stepClaim: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for playing alongside the start of claim flow, ideal for hiding claim buttons and other UI'
		),
		stepOutro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'(optional) Animation state that plays after claim sequence is complete to transition to the next step'
		),
		missionComplete: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for when all steps are complete and have been claimed'
		),

		zoneTransition: {
			default: null,
			type: SagaZoneTransition,
			tooltip: 'Reference to component that handles zone transition choreography',
		},

		infoScreen: {
			default: null,
			type: MissionInfoController,
			tooltip: [
				'(optional) Reference to the mission info controller',
				'Shows the mission info screen during mission intro choreography',
			].join('\n'),
		},
	},

	onLoad() {
		this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
		this.pageView.node.on('page-turning', this.currentStepIDChange, this);
	},

	start() {
		// Initialize zones and setup current zone
		const missionInterface = this.missionStepInterface.missionInterface;
		this._initializeZonesFromMissionInterface(missionInterface);
		const currentZone = this.getCurrentZone();
		this._setupZoneAssets(currentZone);
		this._setupZoneSteps(missionInterface, currentZone);

		const stepID = this.missionStepInterface.stepID;
		const finalStepID = missionInterface.getFinalStepID();
		const missionStepState = this.missionStepInterface.getState();
		if (stepID === finalStepID && missionStepState === 'redeemed') {
			// Mission complete, setup finished mission state
			this.missionComplete.play();
		} else if (missionStepState === 'complete') {
			// Setup scene for claim (this may just be activating the reward sequence for preloading)
			this.stepComplete.play();
		}

		if (this.pageView) {
			// Page view update is frame delayed from initializing the table view
			this.pageView.node.once('pages-update', () => {
				this._pageViewIntro(currentZone, stepID);
			});
		}
		this.emit('saga.initialize-complete');
	},

	_pageViewIntro(currentZone, stepID) {
		if (!this.pageView) {
			return;
		}
		const shouldPlayScrollIntro = +stepID === 0 && this.missionStepInterface.getProgressAmount() === 0;
		if (shouldPlayScrollIntro) {
			// Animate from zone reward to current step
			this.pageView.scrollToPage(0, 0.01);
			Promise.delay(500)
			.then(() => {
				return this.scrollToStep(stepID);
			})
			.then(() => {
				return Promise.delay(500);
			})
			.then(() => {
				if (this.infoScreen) {
					return this.infoScreen.show();
				}
			});
		} else {
			// Scroll immediately to current step
			const nextPageIndex = currentZone.getPageIndex(stepID);
			this.pageView.scrollToPage(nextPageIndex, 0);
		}
	},

	getCurrentZone() {
		const stepID = this.missionStepInterface.stepID;
		return this.getZoneForStepID(stepID);
	},

	scrollToStep(stepID, scrollDuration) {
		if (!this.pageView) {
			return;
		}
		if (scrollDuration == null) {
			scrollDuration = this.scrollDuration;
		}
		const currentPageIndex = this.pageView.getCurrentPageIndex();
		const currentZone = this.getCurrentZone();
		const nextPageIndex = currentZone.getPageIndex(stepID);
		if (nextPageIndex === -1) {
			this.log.e(`Step ${stepID} not found in current zone: ` + JSON.stringify(currentZone.stepIDs));
			return;
		}
		const duration = scrollDuration * Math.abs(nextPageIndex - currentPageIndex);
		this.pageView.scrollToPage(nextPageIndex, duration);
		return Promise.delay(duration * 1e3);
	},

	getZoneForStepID(stepID) {
		let zone = null;
		for (let i = 0; i < this.zones.length; i++) {
			zone = this.zones[i];
			if (zone.stepIDs.indexOf(stepID) > -1) {
				return zone;
			}
		}
		this.log.e('Zone not found for stepID: ' + stepID);
	},

	_initializeZonesFromMissionInterface(missionInterface) {
		if (this._zonesInitialized) {
			return;
		}
		this._zonesInitialized = true;
		const allStepIDs = missionInterface.getAllStepIDs();
		let zoneIndex = 0;
		let zoneGroup = this.zones[zoneIndex];
		for (var i = 0; i < allStepIDs.length; i++) {
			const stepID = allStepIDs[i];
			// Add stepID to zone group
			// Uses unshift to make lower stepIDs appear at the bottom of the content node scroll
			zoneGroup.stepIDs.unshift(stepID);
			const stepData = missionInterface.getStepData(stepID);
			// Check for end of zone reward
			if (stepData.class === 'MissionStepAwardOnly') {
				// Group is finished, move on to next zone group
				zoneIndex += 1;
				zoneGroup = this.zones[zoneIndex];
				if (!zoneGroup) {
					// Create a new group cycling back to the start of the group configuration
					zoneGroup = new SagaZoneGroup();
					zoneGroup.cloneFromZoneGroup(this.zones[zoneIndex % this.zones.length]);
					this.zones.push(zoneGroup);
				}
			}
		}
		let newZones = this.zones.filter((zone) => zone.stepIDs.length > 0);
		this.zones = newZones;
	},

	// One time initialization logic to ensure that the table view is configured with prefabs for all zones
	_initializeTableView() {
		if (this._tableViewInitialized) {
			return;
		}
		if (!this.tableView) {
			this.log.e("Missing table view at initialization");
			return;
		}
		this.zones.forEach((zoneGroup) => {
			this.tableView.addCellPrefab(zoneGroup.stepPrefab);
			this.tableView.addCellPrefab(zoneGroup.zoneRewardPrefab);
		});
		this._tableViewInitialized = true;
	},

	// Swap zone assets for things that change outside of the step prefabs
	_setupZoneAssets(zoneGroup) {
		const zoneName = zoneGroup.zoneName;
		this.zoneAssets.forEach((zoneAsset) => {
			zoneAsset.setupForZone(zoneName);
		});
	},

	// Configure table view to display current zone
	_setupZoneSteps(missionInterface, zoneGroup) {
		if (!this.tableView) {
			this.log.e("Cannot initialize zone without a table view");
			return;
		}
		this._initializeTableView();
		const cellData = zoneGroup.stepIDs.map((stepID) => {
			const data = {
				stepID,
				missionInterface,
				textConfiguration: this.textConfiguration,
				pageView: this.pageView,
			};
			const stepData = missionInterface.getStepData(stepID);
			let prefabName = zoneGroup.stepPrefab.name;
			if (stepData.class === 'MissionStepAwardOnly') {
				prefabName = zoneGroup.zoneRewardPrefab.name;
			}
			return {
				prefab: prefabName,
				data,
			};
		});
		this.tableView.setCellData(cellData);

		// Grab references to the step state controllers
		this._stepControllersByStepID = {};
		const stepControllers = this.tableView.getComponentsInChildren(SagaStep)
			.concat(this.tableView.getComponentsInChildren(SagaStepZoneReward));
		stepControllers.forEach((stepController) => {
			const stepID = stepController.missionStepInterface.stepID;
			this._stepControllersByStepID[stepID] = stepController;
			stepController.on('saga-step.claim-pressed', this.claimStepAward, this);
		});
	},

	getZoneNames() {
		return this.zones.map((zone) => {
			return zone.zoneName;
		});
	},

	addZoneAsset(zoneAsset) {
		if (this.zoneAssets.indexOf(zoneAsset) !== -1) {
			return;
		}
		this.zoneAssets.push(zoneAsset);
	},

	claimStepAward(evt) {
		if (this._claimInProgress) {
			this.log.d("Attempted to claim step award multiple times");
			return;
		}
		this._claimInProgress = true;
		// Immediately snap to current step in the scroll view to avoid the claim being partially off screen
		// Uses a very short duration to make sure the 'scrolling' event updates scroll animations
		this.scrollToStep(this.missionStepInterface.stepID, 0.01);
		this.stepClaim.play();
		const stepState = evt.target;
		this.missionStepInterface.claimAward();
		this._stepBeingClaimed = stepState;
	},

	onStepRewardSequenceIntroComplete() {
		// Allow steps an optional chance to setup for post reward sequence claim choreography while off screen
		if (
			this._stepBeingClaimed
			&& typeof this._stepBeingClaimed.onRewardSequenceIntroComplete === 'function'
		) {
			this._stepBeingClaimed.onRewardSequenceIntroComplete();
		}
	},

	onClaim(evt) {
		if (!this._stepBeingClaimed) {
			this.log.e("Claim choreography error: claimStepAward was not called before a step claim event was sent");
			return;
		}
		const claimedStepID = evt.detail.stepID;
		const claimedStepData = this.missionStepInterface.missionInterface.getStepData(claimedStepID);
		// Claim choreography
		Promise.resolve()
		.then(() => {
			if (claimedStepData.class !== 'MissionStepAwardOnly') {
				return this._claimBasicStep();
			} else {
				return this._claimZoneReward();
			}
		})
		.then(() => {
			const stepID = this.missionStepInterface.stepID;
			const finalStepID = this.missionStepInterface.missionInterface.getFinalStepID();

			const missionStepState = this.missionStepInterface.getState();
			if (stepID === finalStepID && missionStepState === 'redeemed') {
				// Play mission complete animation upon finishing the last step
				return this.missionComplete.play();
			} else {
				// Show UI that was hidden during claim sequence
				return this.stepOutro.play();
			}
		})
		.finally(() => {
			this._claimInProgress = false;
		});
	},

	_claimBasicStep() {
		const nextStepID = this._stepBeingClaimed.missionStepInterface.dependentSteps[0];
		return Promise.resolve()
		.then(() => {
			// Show reward claim sequence
			if (this.stepClaimSequence) {
				this.stepClaimSequence.once('reward-sequence.intro-complete', this.onStepRewardSequenceIntroComplete, this);
				return this.stepClaimSequence.playSequence();
			}
		})
		.then(() => {
			// Mark the step as claimed
			return this._stepBeingClaimed.onClaimAction();
		})
		.then(() => {
			// Scroll to next step
			return this.scrollToStep(nextStepID);
		})
		.then(() => {
			// Unlock next step
			if (this._stepControllersByStepID[nextStepID]) {
				return this._stepControllersByStepID[nextStepID].doUnlock();
			}
		})
		.then(() => {
			// Transition active step interface to next step
			this.missionStepInterface.onStepComplete();
		});
	},

	_claimZoneReward() {
		const nextStepID = this._stepBeingClaimed.missionStepInterface.dependentSteps[0];
		return Promise.resolve()
		.then(() => {
			// Use step choreography first to allow the zone idol to open before showing rewards
			return this._stepBeingClaimed.onClaimAction();
		})
		.then(() => {
			// Start initializing the zone transition overlay
			if (this.zoneTransition) {
				this.zoneTransition.setupForTransition(this._stepBeingClaimed.node);
			}
			// Play the reward sequence
			if (this.zoneClaimSequence) {
				return this.zoneClaimSequence.playSequence();
			}
		})
		.then(() => {
			let transitionPromise = null;
			if (this.zoneTransition) {
				transitionPromise = this.zoneTransition.playSequence();
			}
			// Transition active step interface to next step
			this.missionStepInterface.onStepComplete();
			if (nextStepID) {
				// Transitioning to a new zone
				// Setup next zone while the transition overlay is hiding the zone steps
				const missionInterface = this.missionStepInterface.missionInterface;
				const currentZone = this.getCurrentZone();
				this._setupZoneAssets(currentZone);
				if (this.tableView) {
					// Clear out existing step nodes
					this.tableView.setCellData([]);
				}
				this._setupZoneSteps(missionInterface, currentZone);
				// Page view update is frame delayed from initializing the table view
				this.pageView.node.once('pages-update', () => {
					this.scrollToStep(nextStepID, 0.01).then(() => {
						this._stepControllersByStepID[nextStepID].resetToLocked();
					});
				});
				return transitionPromise
				.then(() => {
					return this._stepControllersByStepID[nextStepID].doUnlock();
				});
			} else {
				// Mission complete, let the mission complete anim setup state while the transition animation plays
				// Intentionally doesn't return the transitionPromise
				return null;
			}
		});
	},

	currentStepIDChange() {
		const currentZone = this.getCurrentZone();
		const stepID = currentZone.stepIDs[this.pageView.getCurrentPageIndex()];
		this.emit('saga.step-change', {
			stepID: stepID
		});
		Object.values(this._stepControllersByStepID).forEach((stepController) => {
			stepController.emit('saga.step-change', {
				stepID: stepID
			});
		});
	},

	getZoneData(){
		const currentZone = this.getCurrentZone();
		let zoneStepCount = currentZone.stepIDs.length;
		let currentStep = zoneStepCount - currentZone.getPageIndex(this.missionStepInterface.stepID);
		// Adjust step numbers to ignore zone end of zone reward
		zoneStepCount -= 1;
		currentStep = Math.min(zoneStepCount, currentStep);
		const zoneCount = this.zones.length;
		const currentZoneIndex = this.zones.indexOf(currentZone) + 1;
		return {
			currentStep,
			zoneStepCount,
			currentZoneIndex,
			zoneCount,
		};
	},
});
