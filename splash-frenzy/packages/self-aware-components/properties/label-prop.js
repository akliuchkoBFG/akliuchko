(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('label-prop', (type) => {
	return type === 'EditorLabelProperty';
});

return Vue.component('label-prop', {
	dependencies: [],

	template: `
		<div :style=cssBlock>{{target.value.text.value}}</div>
	`,

	data() {
		return {
			cssBlock: {
				backgroundColor: "#333",
				border: "1px solid #666",
				borderRadius: "3px",
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
});

})();
