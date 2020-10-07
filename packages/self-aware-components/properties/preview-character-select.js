(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('preview-character-select', (type) => {
	return type === 'PreviewCharacterProperty';
});

return Vue.component('preview-character-select', {
	dependencies: [],

	template: `
		<ui-prop name="Preview Character" :tooltip="defaultTooltip">
			<ui-select
				v-el:character-select
				class="flex-1" 
				@change="onCharacterSelect"
				:value="target.value.characterID.value"
			>
				<option value="0">None</option>
				<option
					v-for="character in characterList"
					:value="character.characterID"
				>
					{{character.characterID}} – {{character.handle}}
				</option>
			</ui-select>
			<ui-button
				class="transparent"
				tooltip="Show/hide manual characterID input"
				@confirm="toggleAdvancedInput"
				@mouseenter="showTooltip"
				@mouseleave="hideTooltip"
			>
				<i class="icon-eye"></i>
			</ui-button>
			<ui-button
				class="blue transparent"
				tooltip="Refresh list for current environment"
				@confirm="refreshCharacterOptions"
				@mouseenter="showTooltip"
				@mouseleave="hideTooltip"
			>
				<i class="icon-cw"></i>
			</ui-button>
		</ui-prop>
		<cc-prop :target.sync="target.value.characterID" v-show="showAdvanced" :indent="1"></ui-prop>
	`,

	data() {
		return {
			defaultTooltip: "Select from recently used characters.\nIf no characters are listed launch the preview scene and refresh the list",
			previewCharacters: [],
			showAdvanced: false,
		};
	},

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	computed: {
		currentCharacterID() {
			return this.target.value.characterID.value;
		},
		isUnknownCharacter() {
			const currentID = +this.target.value.characterID.value;
			if (currentID === 0) {
				return false;
			}
			for (const {characterID} of this.previewCharacters) {
				if (+characterID === currentID) {
					return false;
				}
			}
			return true;
		},
		characterList() {
			if (!this.isUnknownCharacter) {
				return this.previewCharacters;
			} else {
				return this.previewCharacters
					.concat({characterID:this.currentCharacterID, handle: 'Unknown Character'});
			}
		},
	},

	created() {
		this.refreshCharacterOptions();
	},

	methods: {
		onCharacterSelect(event) {
			const selectedCharacterID = event.detail.value;
			Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.value.characterID, selectedCharacterID);
		},
		refreshCharacterOptions() {
			Editor.Ipc.sendToMain(
				'sakit-preview-server:get-characters-for-environment',
				(err, characters) => {
					this.previewCharacters = characters;
				}
			);
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
		stringify(obj) {
			return JSON.stringify(obj, null, 2);
		}
	},
});

})();
