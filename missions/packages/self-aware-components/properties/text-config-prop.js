// Work in progress, had trouble getting a working layout that made senese for configuring text options
// There's a couple different ideas here for trying to layout the bits and pieces
// The general thought was a section for the config description that would be able to expand to multiple lines
// when needed, with two buttons (reset to default and show advanced) alongside. Then below would be the
// multiline text input field for template string
(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('text-config-prop', (type) => {
	// Force disabled so this property uses default rendering for now, see WIP note above
	return false;//type === 'MissionTextConfigurationOption';
});

return Vue.component('text-config-prop', {
	dependencies: [],

	template: `
		<ui-prop-table class="debug">
			<template>
				<ui-row
					:tooltip="description"
				>
					<div class="fill layout horizontal center-center">
						<div
							class="flex-1"
						>
							{{description}}
						</div>
						<span style="width: 10px;"></span>
						<ui-button
							class="transparent"
							tooltip="Show advanced editor properties"
							@confirm="toggleAdvancedInput"
							@mouseenter="showTooltip"
							@mouseleave="hideTooltip"
						>
							<i class="icon-eye"></i>
						</ui-button>
						<ui-button
							class="red transparent"
							tooltip="Reset to default template string"
							@confirm="resetTemplateString"
							@mouseenter="showTooltip"
							@mouseleave="hideTooltip"
						>
							<i class="icon-ccw"></i>
						</ui-button>
					</div>
				</ui-row>
			</template>
		</ui-prop-table>
	`,

	// Initial approach, attempting to layout the pieces appropriately with CSS/HTML
	// Getting the property height/multiline description correct seemed to be more difficult than expected

	// template: `
	// 	<ui-prop 
	// 		:name="target.name"
	// 		class="layout vertical"
	// 	>
	// 		<div :style=heightCss class="layout horizontal center flex-1">
	// 		<div
	// 			class="flex-1"
	// 			v-el:desc
	// 		>
	// 			{{description}}
	// 		</div>
	// 		<ui-button
	// 			class="transparent"
	// 			tooltip="Show advanced editor properties"
	// 			@confirm="toggleAdvancedInput"
	// 			@mouseenter="showTooltip"
	// 			@mouseleave="hideTooltip"
	// 		>
	// 			<i class="icon-eye"></i>
	// 		</ui-button>
	// 		<ui-button
	// 			class="red transparent"
	// 			tooltip="Reset to default template string"
	// 			@confirm="resetTemplateString"
	// 			@mouseenter="showTooltip"
	// 			@mouseleave="hideTooltip"
	// 		>
	// 			<i class="icon-cw"></i>
	// 		</ui-button>
	// 		</div>
	// 		</div>
	// 	</ui-prop>
	// `,

	data() {
		return {
			cssBlock: {
				margin: "10px",
				padding: "10px"
			},
		};
	},

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	computed: {
		description() {
			return this.target.value.description.value;
		},
		heightCss() {
			let height = 20;
			if (this.$els.desc) {
				height = this.$els.desc.getBoundingClientRect().height;
			}
			height += 10;
			return {height: height + 'px'};
		},
	},

	methods: {
		buttonClick() {
			// Toggle the listener boolean
			Editor.SAG.ComponentUtils.changePropValue(
				this.$el,
				this.target.value.listener,
				!this.target.value.listener.value
			);
		},

		resetTemplateString() {
			// TODO
		},

		toggleAdvancedInput() {
			// TODO
		},


		showTooltip(event) {
			Editor.SAG.Tooltip.show(event.target, 'right');
		},
		hideTooltip(/* event */) {
			Editor.SAG.Tooltip.hide();
		},
	}
});

})();
