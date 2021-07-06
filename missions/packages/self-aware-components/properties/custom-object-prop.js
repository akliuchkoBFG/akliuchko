// This property does not register with SharedComponentUtils
// It is forced automatically in getComponentType

// Component definition almost entirely copied from editor/builtin/inspector/share/object-prop.js
// Primary modification is the <component :is> definition for determining vue component type
// This allows us to inject custom Vue components similar to how custom-property-inspector works
Vue.component("custom-object-prop", {
	template: `
		<ui-prop
			:tooltip="target.attrs.tooltip"
			:name="target.name"
			:indent="indent"
			v-readonly="target.attrs.readonly"
			foldable
		>
			<div class="child">
				<template v-for="prop in target.value">
					<component
						v-if="prop.attrs.visible !== false"
						:is="getCompType(prop)"
						:target.sync="prop"
						:indent="indent+1"
					></component>
				</template>
			</div>
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
		getCompType(prop) {
			return Editor.SAG.ComponentUtils.getComponentType(prop);
		},
	}
});