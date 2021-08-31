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