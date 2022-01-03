/* global
*/
const MissionInterface = require("MissionInterface");
const PreviewCharacterProperty = require("PreviewCharacterProperty");

const FakeTemplateId = "CocosCreatorBogus";
cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		menu: 'Add Mission Component/Select Template',
		inspector: Editor.SAG.ComponentInspector('mission-template-select'),
		disallowMultiple: true,
		executeInEditMode: true,
		requireComponent:MissionInterface,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/474907058/Mission+Server+Data+Component',
		// Not sure we need to require an instantiated mission component, but that'd be nice to partition mission editing from retrieval/instantiation
	},

	properties: {
		editorOnly: true,
		previewCharacter: {
			default: function() {
				return new PreviewCharacterProperty();
			},
			serializable: false,
			type: PreviewCharacterProperty,
			editorOnly: true,
		},
		instantiationSource: {
			default: "cocos_creator",
			displayName: "Source",
			tooltip: "Source for the mission system to track in the mission instantiated from the selected template",
		},
		templateID: {
			default: FakeTemplateId,
			displayName: "Template ID",
			tooltip: "Template ID for the mission system to instantiate",
		},
		templateName: {
			default: 'Placeholder',
			displayName: 'Template Name',
			tooltip: 'this property will only be populated when a template is selected',
		},
		missionDataIndex: {
			default: 0,
			displayName: "Mission Data Index",	
			tooltip: "Index (from 0) of the mission's source data in the mission array returned by the backend system",
		},
		missionInterface: {
			show:false,
			default: null,
			type: MissionInterface,
		},
		missionJSONString: {
			default: '[]',
			displayName: 'MissionJSON',
			tooltip: 'this property will only be populated when a mission is retrieved or instantiated',
			notify:function(val) {
				this.updateInterfaceData();
				this.updatePreviewData();
			}
		},
		instantiateMissionTrigger: {
			default: false,
			show:false,
			notify: function(val) {
				if(val !== this.instantiateMissionTrigger) {
					this.updateInstantiatedMissionData(this.templateID, this.previewCharacter.characterID, this.instantiationSource, this.missionDataIndex, false);
				}
			}
		},
		retrieveMissionTrigger: {
			default: false,
			show:false,
			notify: function(val) {
				if(val !== this.retrieveMissionTrigger) {
					this.updateInstantiatedMissionData(this.templateID, this.previewCharacter.characterID, this.instantiationSource, this.missionDataIndex, true);
				}
			}
		},
		updatePreviewDataTrigger: {
			default: false,
			show:false,
			notify: function(val) {
				if(val !== this.updatePreviewDataTrigger) {
					this.updatePreviewData();
				}
			}
		},
		componentUpdateCallbackTrigger: {
			default: false,
			show:false,
			notify: function(val) {
				if(val !== this.componentUpdateCallbackTrigger) {
					if(this.templateID !== FakeTemplateId) {
						this.updateInstantiatedMissionData(this.templateID, this.previewCharacter.characterID, this.instantiationSource, this.missionDataIndex, true);
					}
				}
			}
		},
	},

	boundedMissionArrayAccess: function (missionIndex, missionsArray) {
		var boundedIndex = Math.max(0, Math.min(missionIndex, missionsArray.length-1));
		var mission = missionsArray[boundedIndex];
		return mission;
	},

	updateBackendMissionData: function (missionIndex, missionID, stepIndex, stepProgress) {
		if (CC_EDITOR) {
			Editor.log("updateBackendMissionData!");
			const formData = {
				missionID: missionID,
				stepID: stepIndex,
				stepProgress: stepProgress,
				characterID: this.previewCharacter.characterID,
			};
			Editor.log("mission ID:"+missionID+ " StepID:"+stepIndex+" Progress:"+stepProgress);
			Editor.SAG.PigbeeRequest.post({
				env: 'dev',
				controller: 'cocos_creator',
				action: 'updateMissionForStepProgress',
				formData,
			})
			.then((response) => {
				try {
					Editor.success("Instantiated Mission Retrieved:" + response + " status: "+response.statusCode);
					var missionsArray = JSON.parse(response);
					if (missionsArray.success === false) {
						throw new Error(missionsArray.error || 'Unknown server error');
					}
					const mission = this.boundedMissionArrayAccess(missionIndex, missionsArray);
					this.missionJSONString = JSON.stringify(mission);
				} catch(e) {
					Editor.error("Progress update Failed: " +e);
				}
			})
			.catch((err) => {
				Editor.error("Can't connect with the environment to update mission progress\n" + err);
			});
		}
	},

	resetBackendMissionData: function(missionID) {
		if (!CC_EDITOR) {
			return;
		}
		const formData = {
			missionID: missionID,
			characterID: this.previewCharacter.characterID,
		};
		Editor.SAG.PigbeeRequest.post({
			env: 'dev',
			controller: 'cocos_creator',
			action: 'resetMissionProgress',
			formData,
		})
		.then((response) => {
			try {
				const mission = JSON.parse(response);
				if (mission.success === false) {
					throw new Error(mission.error || 'Unknown server error');
				}
				this.missionJSONString = JSON.stringify(mission);
			} catch(e) {
				Editor.error("Progress reset Failed: " +e);
			}
		})
		.catch((err) => {
			Editor.error("Can't connect with the environment to reset mission progress\n" + err);
		});
	},

	updateInstantiatedMissionData: function (templateID, characterID, templateSource, missionIndex, getExisting) {
		if (CC_EDITOR) {
			const formData = {
				templateID: JSON.stringify(templateID),
				characterID: characterID,
				templateSource: templateSource,
				getExisting: JSON.stringify(getExisting)
			};

			Editor.success("templateID:" + templateID + " characterID:" + characterID + " sourceString:" + templateSource);
			if(templateID === FakeTemplateId) {
				Editor.log("Please select a valid template id from the list");
				return;
			}
			Editor.SAG.PigbeeRequest.post({
				env: 'dev',
				controller: 'cocos_creator',
				action: 'getEditorMissionFromTemplateAndCharacterID',
				formData,
			})
			.then((response) => {
				try {
					var parsedMissionsResponse = JSON.parse(response);
					if(parsedMissionsResponse.success == null) {
						Editor.success("Instantiated Mission Retrieved:" + response);
						const mission = this.boundedMissionArrayAccess(missionIndex, parsedMissionsResponse);
						// Test against the template version, is the instantiated mission stale?
						this.missionJSONString = JSON.stringify(mission);
					} else {
						Editor.log("No Instantiated Mission Found");
						this.missionJSONString = JSON.stringify({});
					}
				} catch(e) {
					Editor.error([
						"Error while retrieving/instantiating mission",
						"Response: " + response,
						"Error: " + e,
					].join("\n"));
				}
			})
			.catch((err) => {
				Editor.error("Can't connect with the environment to update instantiated mission data\n" + err);
			});
		}
	},

	updateInterfaceData: function() {
		var missionJSON = JSON.parse(this.missionJSONString);
		var myInterface = this.getComponent(MissionInterface);
		this.missionInterface = myInterface;
		this.missionInterface.updateMissionDataWithNotice(missionJSON);
	},

	updatePreviewData: function() {
		var missionJSON = JSON.parse(this.missionJSONString);
		var dataArray = new Array(this.missionDataIndex+1);
		dataArray[this.missionDataIndex] = missionJSON;
		Editor.SAG.provideLoadData("missionData", dataArray);
	},
	
	onLoad: function() {
		this._objFlags |= cc.Object.Flags.EditorOnly;
		if (CC_EDITOR) {
			this.node.on('updateProgressForStep', (event) => {
				event.stopPropagation();
				var stepID = event.detail.stepInterface.stepID;
				var stepProgress = event.detail.stepProgress;
				var missionID = event.detail.stepInterface.getMissionID();
				Editor.log([
					"updateProgressForStep",
					"Event > detail> step interface > stepID: " + event.detail.stepInterface.stepID,
					"Progress: " + stepProgress,
					"MissionID: "+ missionID,
					"Template: " + this.templateID
				].join("\n"));
				this.updateBackendMissionData(this.missionDataIndex, missionID, stepID, stepProgress);
			});	
		}
	},

	start: function() {
		if (CC_EDITOR) {
			// TODO: Check the saved state of the MSDC in the scene and refresh the instantiated mission on load if possible.
			if(this.templateID !== FakeTemplateId) {
				this.updateInstantiatedMissionData(this.templateID, this.previewCharacter.characterID, this.instantiationSource, this.missionDataIndex, true);
			}
		}
	}
});
