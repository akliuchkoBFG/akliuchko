(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('label-prop', (type) => {
	return type === 'EditorLabelProperty';
});

return Vue.component('label-prop', {
	dependencies: [],

	template: `
		<div :style=cssBlock><span v-html="multilineText"></span></div>
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

	computed: {
		multilineText() {
			return this.target.value.text.value
				// Escape HTML values
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;")
				// Convert newlines to HTML line breaks
				.replace(/\n/g, '<br>');
		},
	},
});

})();
