// This component is used to set progress in the editor for a better wysiwyg experience

const BaseMissionStepComponent = require('BaseMissionStepComponent');

cc.Class({
	extends: BaseMissionStepComponent,
	mixins: [cc.EventTarget],

	editor: CC_EDITOR && {
		// Deprecated in favor of Mission Preview Panel, no menu path needed
		executeInEditMode: true,
		disallowMultiple: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562659476/Mission+Step+Preview'
	},

	properties: {
		// TODO: bound or make slider


		maxProgress: {
			default: 0,
			readonly: true,
			visible: false,
			serializable: false,
		},

		stepState: {
			default: "",
			tooltip: "The current state of the step",
			readonly:true,
			serializable: false,
		},

		stepProgress: {
			default: 0,
			tooltip: "The exact progress to set on this step",
			serializable: false,
		},

		percentProgress: {
			default: 0,
			slide:true,
			max: 100,
			tooltip: "The progress to set on this step",
			serializable: false,
			notify: function(val) {
				if(val !== this.percentProgress) {
					this.stepProgress = Math.round(this.maxProgress * (this.percentProgress/100));
				}
			},
		},

		updateStepData: {
			default: false,
			tooltip: "Triggers an update of the mission state from this steps current state",
			serializable: false,
			notify: function(oldVal) {
				if(this.updateStepData && this.updateStepData !== oldVal) {
					this._updateMissionServerData();
				}
			}
		}
	},

	onLoad: function() {
		this._objFlags |= cc.Object.Flags.EditorOnly;
		this._super();
	},

	onUpdateMissionStepData: function() {
		// sync with new mission data
		if (this.missionStepInterface) {
			this.stepProgress = this.missionStepInterface.getProgressAmount();
			this.maxProgress = this.missionStepInterface.getProgressMax() || -1;
			this.percentProgress = this.stepProgress/this.maxProgress * 100;
			this.stepState = this.missionStepInterface.getState();
		}

		// untoggle
		this.updateStepData = false;
	},

	//Note: we could also pull ALL the updated steps via the MSDC and potentially send a multistep mission update call
	_updateMissionServerData: function() {
		if (CC_EDITOR) {
			// Send this interface along with a custom event to trigger an update to mission state
			if (this.missionStepInterface) {
				const stepProgressEvent = new cc.Event.EventCustom('updateProgressForStep', true);
				stepProgressEvent.detail = { 
					stepInterface: this.missionStepInterface,
					stepProgress: this.stepProgress,
					missionID: this.missionStepInterface.getMissionID(),
				};
				this.node.dispatchEvent(stepProgressEvent);
			} else {
				Editor.warn('No StepInterface found to preview');
			}
		}
	},

});
