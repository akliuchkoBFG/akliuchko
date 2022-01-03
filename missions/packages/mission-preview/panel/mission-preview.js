(() => {
/* eslint-disable global-require */
const fs = require('fire-fs');
const async = require('async');
const _ = require('lodash');
const PigbeeRequest = Editor.require('packages://pigbee-utils/PigbeeRequest.js');
const PackageUtil = Editor.require('packages://package-utils/PackageUtil.js');
const MissionPreviewUtil = new PackageUtil('mission-preview');
/* eslint-enable global-require */

const FILES = {
	html: Editor.url('packages://mission-preview/panel/mission-preview.html'),
	style: Editor.url('packages://mission-preview/panel/mission-preview.css'),
};

const TIME_OPTIONS = [
	{value: '', display:"No Change"},
	{value: 'reset', display: "Reset to Start"},
	// Actual time offsets are moving the start/end dates of the mission
	// Moving the mission ahead needs a negative offset and back needs a positive offset
	{value: '-1 hour', display: "Ahead 1 Hour"},
	{value: '-12 hours', display: "Ahead 12 Hours"},
	{value: '-1 day', display: "Ahead 1 Day"},
	{value: '+1 hour', display: "Back 1 Hour"},
	{value: '+12 hours', display: "Back 12 Hours"},
	{value: '+1 day', display: "Back 1 Day"},
];

// panel/index.js, this filename needs to match the one registered in package.json
return Editor.Panel.extend({
	// css style for panel
	style: fs.readFileSync(FILES.style),

	// html template for panel
	template: fs.readFileSync(FILES.html),

	// element and variable binding
	$: {
		wrap: '#wrap',
	},

	// method executed when template and styles are successfully loaded and initialized
	ready () {
		this.vue = new Vue({
			el: this.$wrap,
			data: {
				missionID: null,
				characterID: 0,
				stepIDs: [],
				templateID: 0,
				templateName: "",
				templateVersion: 0,
				selectedStepID: 0,
				selectedStepData: null,
				stepProgress: 0,
				compileFinished: false,
				lastUpdate: null,
				timeOptions: TIME_OPTIONS,
				timeOffset: "",
			},
			computed: {
				missionHumanReadable() {
					return `${this.templateID} – ${this.templateName} (v: ${this.templateVersion})`;
				},
				progressPercent() {
					if (!this.selectedStepData) {
						return 0;
					}
					return Math.floor(this.stepProgress / this.selectedStepData.data.max * 100);
				}
			},
			compiled() {
				this.compileFinished = true;
				// Would be nice to attempt a load here to make sure this panel gets data if opened after the scene
				// But unfortunately it triggers scene script not found warnings if the panel exists before scene load
			},
			methods: {
				resetState() {
					// Clear out the references that let the mission panel show data
					this.missionID = null;
					this.selectedStepData = null;
					this.lastUpdate = null;
					if (this.$els.reupdateButton) {
						this.$els.reupdateButton.disabled = true;
					}
				},

				loadFromScene() {
					this._loadFromScene().catch((err) => {
						Editor.failed('Unable to load mission data from scene\n' + err);
					});
				},

				// This may fail due to load timing
				_loadFromScene() {
					if (this._loading) {
						return this._loading;
					}
					this._loading = MissionPreviewUtil.callSceneScript('load-mission-data')
					.then((previewData) => {
						this.missionID = previewData.missionID;
						this.characterID = previewData.characterID;
						this.stepIDs = previewData.stepIDs;
						this.templateID = previewData.templateID;
						this.templateName = previewData.templateName;
						this.templateVersion = previewData.templateVersion;
						this.selectedStepID = previewData.currentStepID;
						if (this.missionID) {
							this.selectStep();
						}
					})
					.finally(() => {
						this._loading = null;
					});
					return this._loading;
				},

				_updateSlider() {
					const slider = this.$els.progressSlider;
					slider.min = 0;
					slider.max = this.selectedStepData.data.max;
					slider.step = 1;
					slider.snap = true;
					slider.value = this.stepProgress;
				},

				selectStep() {
					MissionPreviewUtil.callSceneScript('load-mission-step-data', this.selectedStepID)
					.then((stepData) => {
						this.selectedStepData = stepData;
						this.stepProgress = stepData.data.progress;
						this._updateSlider();
					});
				},

				adjustMissionTime() {
					if (this.timeOffset === '') {
						Editor.log("Skipped timeline update, please select a valid timeline offset");
						return;
					}
					const postData = {
						missionID: this.missionID,
						characterID: this.characterID,
						timeOffset: this.timeOffset,
					};
					PigbeeRequest.post({
						controller: 'cocos_creator',
						action: 'adjustMissionTime',
						formData: postData,
						env: 'dev',
					})
					.then((result) => {
						if (SAStringUtil && SAStringUtil.formatTimeToWords) {
							const missionData = JSON.parse(result);
							const readableTimeActive = SAStringUtil.formatTimeToWords(missionData.secondsActive * 1e3, 2);
							const readableTimeRemaining = SAStringUtil.formatTimeToWords(missionData.secondsRemaining * 1e3, 2);
							Editor.success(`Mission time adjusted; Time active: ${readableTimeActive}; Time remaining: ${readableTimeRemaining}`);
						} else {
							Editor.success("Mission time adjusted");
						}
						return MissionPreviewUtil.callSceneScript('update-mission-json', result);
					});
				},

				updateMissionProgress() {
					const postData = {
						missionID: this.missionID,
						stepID: this.selectedStepID,
						stepProgress: this.stepProgress,
					};
					this.lastUpdate = postData;
					this.$els.reupdateButton.disabled = false;
					// TODO this might be cleaner as a PigbeeRequest from this panel that sends out a scene update
					MissionPreviewUtil.callSceneScript('simulate-mission-progress', postData)
					.then(() => {
						Editor.success("Forced mission progress");
					});
				},

				reupdateMissionProgress() {
					if (!this.lastUpdate) {
						Editor.failed("Cannot resimulate mission progress without setting a simulation point first with Simulate Progress");
						return;
					}
					MissionPreviewUtil.callSceneScript('simulate-mission-progress', this.lastUpdate)
					.then(() => {
						Editor.success("Forced mission progress");
					});
				},

				resetMissionProgress() {
					const postData = {
						missionID: this.missionID,
					};
					MissionPreviewUtil.callSceneScript('reset-mission-progress', postData)
					.then(() => {
						Editor.success("Reset mission progress");
					});
				},

				findMSDC() {
					MissionPreviewUtil.callSceneScript('find-msdc')
					.catch((err) => {
						Editor.failed("MissionServerDataComponent not found in scene\n" + err);
					});
				},

				// Tooltip controls
				showTooltip(event) {
					Editor.SAG.Tooltip.show(event.target);
				},
				hideTooltip(/* event */) {
					Editor.SAG.Tooltip.hide();
				},
			},
		});

	},

	// register your ipc messages here
	messages: {
		'scene:ready'() {
			// Clear out existing mission data for the new scene
			this.vue.resetState();
			// Attempt to load mission data from the scene
			// This will probably fail because it's racing the server request, but it adds an event listener to trigger
			//  'mission-preview:mission-update' when the server request finishes
			this.vue._loadFromScene()
			.catch(() => {
				// Intentionally empty
			});
		},
		'mission-preview:mission-update'() {
			if (this.vue && this.vue.compileFinished) {
				this.vue._loadFromScene()
				.catch(() => {
					// Intentionally empty
				});
			}
		},
	}
});

})();