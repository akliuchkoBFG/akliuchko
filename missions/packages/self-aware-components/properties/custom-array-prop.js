// This property does not register with SharedComponentUtils
// It is forced automatically in getComponentType

// Component definition almost entirely copied from editor/builtin/inspector/share/array-prop.js
// Primary modification is the <component :is> definition for determining vue component type
// This allows us to inject custom Vue components similar to how custom-property-inspector works
Vue.component("custom-array-prop", {
	template: `
		<ui-prop
			:tooltip="target.attrs.tooltip"
			:name="target.name"
			:indent="indent"
			v-readonly="target.attrs.readonly"
			foldable
		>
			<template v-if="!target.values || target.values.length <= 1">
				<ui-num-input class="flex-1"
					type="int" min="0"
					:value="target.value.length"
					@confirm="arraySizeChanged"
				></ui-num-input>
			<div class="child">
				<component
					v-for="prop in target.value"
					:is="getCompType(prop)"
					:target.sync="prop"
					:indent="indent+1"
				></component>
			</div>
		</template>
		<template v-else>
			<span>Difference</span>
		</template>
		</ui-prop>
	`,
	props: {
		indent: {
			type: Number,
			default: 0
		},
		target: {
			twoWay: !0,
			type: Object
		}
	},
	methods: {
		arraySizeChanged(e) {
			if (e.detail.value < this.target.value.length) {
				const t = new Array(e.detail.value);
				for (let n = 0; n < e.detail.value; ++n) t[n] = this.target.value[n];
				this.target.value = t;
			} else this.target.value.length = e.detail.value;
			Editor.UI.fire(this.$el, "target-size-change", {
				bubbles: !0,
				detail: {
					path: this.target.path + ".length",
					value: e.detail.value
				}
			});
		},

		getCompType(prop) {
			return Editor.SAG.ComponentUtils.getComponentType(prop);
		},
	}
});