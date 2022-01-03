/* global
	_Scene
*/
const PackageUtil = Editor.require('packages://package-utils/PackageUtil.js');
const IPCError = PackageUtil.IPCError;

function onMissionDataLoad() {
	Editor.Ipc.sendToPanel('mission-preview', 'mission-preview:mission-update');
}

module.exports = {
	'load-mission-data'(event) {
		const scene = _Scene.currentScene();
		// TODO multiple MSDC?
		const msdc = scene.getComponentInChildren('MissionServerDataComponent');
		
		if (event && event.reply) {
			if (msdc) {
				const missionInterface = msdc.missionInterface;
				missionInterface.off('updateMissionDataEvent', onMissionDataLoad);
				missionInterface.on('updateMissionDataEvent', onMissionDataLoad);
				if (!missionInterface.isInitialized()) {
					const err = new IPCError('Mission Interface not loaded', 'not_loaded');
					event.reply(err);
					return;
				}
				const templateVersion = missionInterface._missionData && missionInterface._missionData.templateVersion || 'unknown';
				const activeStepIDs = missionInterface.getActiveStepIDs();
				const allStepIDs = missionInterface.getAllStepIDs();
				const missionData = {
					characterID: msdc.previewCharacter.characterID,
					missionID: missionInterface.getMissionID(),
					templateID: missionInterface.getTemplateID(),
					templateName: msdc.templateName,
					templateVersion: templateVersion,
					stepIDs: allStepIDs,
					currentStepID: activeStepIDs.length > 0 ? activeStepIDs[0] : allStepIDs[allStepIDs.length - 1],
				};
				event.reply(null, missionData);
			} else {
				const err = new IPCError('No misison interface', 'msdc_not_found');
				event.reply(err);
			}
		}
	},
	'load-mission-step-data'(event, stepID) {
		const scene = _Scene.currentScene();
		// TODO multiple MSDC?
		const msdc = scene.getComponentInChildren('MissionServerDataComponent');
		
		if (event && event.reply) {
			if (msdc) {
				const missionInterface = msdc.missionInterface;
				const stepData = missionInterface.getStepData(stepID);
				event.reply(null, stepData);
			} else {
				const err = new IPCError('No misison interface', 'msdc_not_found');
				event.reply(err);
			}
		}
	},
	'update-mission-json'(event, missionJSON) {
		const scene = _Scene.currentScene();
		// TODO multiple MSDC?
		const msdc = scene.getComponentInChildren('MissionServerDataComponent');

		if (msdc) {
			msdc.missionJSONString = missionJSON;
			event.reply(null);
		} else {
			const err = new IPCError('No misison interface', 'msdc_not_found');
			event.reply(err);
		}
	},
	'simulate-mission-progress'(event, postData) {
		const scene = _Scene.currentScene();
		// TODO multiple MSDC?
		const msdc = scene.getComponentInChildren('MissionServerDataComponent');
		
		if (event && event.reply) {
			if (msdc) {
				msdc.updateBackendMissionData(0, postData.missionID, postData.stepID, postData.stepProgress);
				event.reply(null);
			} else {
				const err = new IPCError('No mission interface', 'msdc_not_found');
				event.reply(err);
			}
		}
	},
	'reset-mission-progress'(event, postData) {
		const scene = _Scene.currentScene();
		// TODO multiple MSDC?
		const msdc = scene.getComponentInChildren('MissionServerDataComponent');
		if (event && event.reply) {
			if (msdc) {
				msdc.resetBackendMissionData(postData.missionID);
				event.reply(null);
			} else {
				const err = new IPCError('No mission interface', 'msdc_not_found');
				event.reply(err);
			}
		}
	},
	'find-msdc'(event) {
		const scene = _Scene.currentScene();
		// TODO multiple MSDC?
		const msdc = scene.getComponentInChildren('MissionServerDataComponent');
		
		if (event && event.reply) {
			if (msdc) {
				const nodeID = msdc.node.uuid;
				Editor.Selection.select('node', nodeID);
				event.reply(null);
			} else {
				const err = new IPCError('No misison interface', 'msdc_not_found');
				event.reply(err);
			}
		}
	}
};
