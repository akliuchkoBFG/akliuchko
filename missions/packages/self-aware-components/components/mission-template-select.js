(() => {
const componentDataContainer = { 
	// This property key must exist to get watcher updates when slot data refreshes
	// Consequently data refreshes must always update the data for this key to trigger a redraw
	initial: true,
	templates: {},
};

function updateTemplateData(myCallback) {
	Editor.SAG.PigbeeRequest.get({
		env: 'dev',
		controller: 'cocos_creator',
		action: 'getMissionTemplatesWithIDs',
	})
	.then((response) => {
		try {
			// Editor.success(response);
			const templates = JSON.parse(response);
			componentDataContainer.templates = templates;
			componentDataContainer.initial = false;
			if (myCallback) {
				Editor.success("Updated template list");
				myCallback();
			}
		} catch(e) {
			Editor.error([
				"Can't update templates, unexpected data response",
				"Response: " + response,
				"Error: " + e,
			].join("\n"));
		}
	}).catch((err) => {
		Editor.error("Can't connect to Pigbee to update mission template list\n" + err);
	});
}

// Make a silent initial request for template data
updateTemplateData(null);

return Vue.component('template-selector-inspector', {
	dependencies: [
		'packages://self-aware-components/properties/preview-character-select.js',
	],

	template: `
		<ui-prop name="Mission Template" tooltip="Mission Template to Instantiate">
			<ui-select class="flex-1" @change="onTemplateSelect" :value="target.templateID.value" v-if="!componentDataContainer.initial">
				<option v-for="templateProperties in componentDataContainer.templates" :value="templateProperties.mission.id">{{templateProperties.mission.id}} – {{templateProperties.mission.name}} (v: {{templateProperties.mission.version}})</option>
			</ui-select>
			<ui-button class="blue transparent" tooltip="Refresh list from Pigbee" @confirm="refreshTemplateOptions" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-cw"></i></ui-button>
		</ui-prop>
		<ui-prop name="Actions" tooltip="Mission Server Actions">
			<ui-button class="transparent" tooltip="Instantiate From Template ID" @confirm="instantiateMission" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-plus"></i></ui-button>
			<ui-button class="transparent" tooltip="Toggle advanced input" @confirm="toggleAdvancedInput" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-eye"></i></ui-button>
			<ui-button class="transparent" tooltip="Get existing instantiated mission matching Template ID/version for characterID" @confirm="getInstantiatedMission" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-ccw"></i></ui-button>
			<ui-button class="transparent" tooltip="Update LoadData missionJSON for Preview" @confirm="updatePreviewData" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-record"></i></ui-button>
		</ui-prop>
		<preview-character-select :target.sync="target.previewCharacter"></preview-character-select>
		<ui-prop v-prop="target.instantiationSource" v-show=true v-value="target.instantiationSource.value"></ui-prop>
		<ui-prop v-prop="target.templateID" v-show="showAdvanced"></ui-prop>
		<ui-prop v-prop="target.templateName" v-show="showAdvanced" v-value="target.templateName.value"></ui-prop>
		<ui-prop v-prop="target.missionDataIndex" v-show="showAdvanced" v-value="target.missionDataIndex.value"></ui-prop>
		<ui-prop v-prop="target.missionJSONString" v-show="showAdvanced" v-value="target.missionJSONString.value"></ui-prop>
		<ui-prop v-prop="target.missionInterface" v-show="showAdvanced"></ui-prop>
	`,

	data: function() {
		return {
			componentDataContainer,
			showAdvanced: false,
		};
	},

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	methods: {
		onTemplateSelect(event) {
			const selected = event.detail.value;
			const templateProperties = this.componentDataContainer.templates[selected];
			if (templateProperties.mission.id) {
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.templateID, templateProperties.mission.id);
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.templateName, templateProperties.mission.name);
				// update instantiated mission data
				this.getInstantiatedMission();
			} else {
				Editor.error("Unknown template options detected, please contact an engineer in #sag-cocos-creator");
			}
		},
		updateComponentOnChangesCallback() {
				var localVue = this;
				return function() {
					var componentUpdateCallbackTrigger = localVue.target.componentUpdateCallbackTrigger.value;
					Editor.SAG.ComponentUtils.changePropValue(localVue.$el, localVue.target.componentUpdateCallbackTrigger, !componentUpdateCallbackTrigger);
				};
		},
		refreshTemplateOptions() {
			updateTemplateData((this.updateComponentOnChangesCallback()));
		},
		instantiateMission() {
			var instantiateMissionTrigger = this.target.instantiateMissionTrigger.value;
			Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.instantiateMissionTrigger, !instantiateMissionTrigger);
		},
		getInstantiatedMission() {
			var retrieveMissionTrigger = this.target.retrieveMissionTrigger.value;
			Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.retrieveMissionTrigger, !retrieveMissionTrigger);
		},
		toggleAdvancedInput() {
			this.showAdvanced = !this.showAdvanced;
		},
		showTooltip(event) {
			Editor.SAG.Tooltip.show(event.target, 'right');
		},
		hideTooltip(/* event */) {
			Editor.SAG.Tooltip.hide();
		},
		updatePreviewData() {
			// Explicit update from the current state of the missionJSON
			var updatePreviewDataTrigger = this.target.updatePreviewDataTrigger.value;
			Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.updatePreviewDataTrigger, !updatePreviewDataTrigger);
		},
	},
});

})();
