(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('button-prop', (type) => {
	return type === 'EditorButtonProperty';
});

return Vue.component('button-prop', {
	dependencies: [],

	template: `
		<div :style=cssBlock>
			<ui-button
				@click="buttonClick"
				:tooltip="target.attrs.tooltip"
				@mouseenter="showTooltip"
				@mouseleave="hideTooltip"
			>
				{{target.value.title.value}}
			</ui-button>
		</div>
	`,

	data() {
		return {
			cssBlock: {
				margin: "10px",
				padding: "10px",
				paddingLeft: 10 + 13 * this.indent + "px",
			},
		};
	},

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
		indent: {
			type: Number,
			default: 0
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
		showTooltip(event) {
			Editor.SAG.Tooltip.show(event.target, 'left');
		},
		hideTooltip(/* event */) {
			Editor.SAG.Tooltip.hide();
		},
	}
});

})();
