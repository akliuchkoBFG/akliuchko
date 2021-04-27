(() => {

Editor.SAG.ComponentUtils.registerPropertyInspector('spine-state-prop', (type) => {
	return type === 'SpineStateProperty';
});

return Vue.component('spine-state-prop', {
	dependencies: [],

	template: `
		<ui-prop
			:name="target.name"
			:tooltip="target.attrs.tooltip"
		>
			<ui-select
				class="flex-1" 
				@change="onAnimationSelect"
				:value="target.value.animationIndex.value"
			>
				<option
					v-for="option in selectOptions"
					:value="option.value"
				>
					{{option.name}}
				</option>
			</ui-select>
		</ui-prop>
	`,

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	computed: {
		selectOptions() {
			const values = this.target.value._animationIndexValues.value;
			const names = this.target.value._animationIndexNames.value;
			return values.map((value, index) => {
				const option = {};
				option.value = value.value;
				option.name = names[index].value;
				return option;
			});
		}
	},

	methods: {
		onAnimationSelect(event) {
			const selectedIndex = +event.detail.value;
			Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.value.animationIndex, selectedIndex);
		},
	}
});

})();
