Vue.component('property-debugger', {

	template: `
		<div v-for="(propName, prop) in target">
			<pre>{{propName}}\n{{stringify(prop)}}</pre>
			<component :is="prop.compType" :target.sync="prop" v-if="prop.attrs.visible !== false"></component>
		</div>
	`,

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	methods: {
		stringify(prop) {
			return JSON.stringify(prop, null, 2);
		},
	},
});
