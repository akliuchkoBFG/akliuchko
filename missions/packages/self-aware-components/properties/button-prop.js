(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('button-prop', (type) => {
	return type === 'EditorButtonProperty';
});

return Vue.component('button-prop', {
	dependencies: [],

	template: `
		<div :style=cssBlock>
			<ui-button @click="buttonClick">{{target.value.title.value}}</ui-button>
		</div>
	`,

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

	methods: {
		buttonClick() {
			// Toggle the listener boolean
			Editor.SAG.ComponentUtils.changePropValue(
				this.$el,
				this.target.value.listener,
				!this.target.value.listener.value
			);
		},
	}
});

})();
