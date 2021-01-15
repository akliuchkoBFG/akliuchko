(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('animation-clip-prop', (type) => {
	return type === 'AnimationClipProperty';
});

return Vue.component('animation-clip-prop', {
	dependencies: [],

	template: `
		<ui-prop
			style="padding-top: 10px"
			:name="target.name"
			:tooltip="target.attrs.tooltip"
		>
			<ui-asset
				class="flex-1"
				type="cc.AnimationClip"
				v-value="target.value.animationClip.value.uuid"
			></ui-asset>
		</ui-prop>
	`,

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	methods: {
	}
});

})();
