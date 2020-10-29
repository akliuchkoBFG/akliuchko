(() => {
/* eslint-disable global-require */
const fs = require('fs');
/* eslint-enable global-require */

// Known dependencies
const dependencies = [];

// Dynamic dependencies: load all Vue components from the properties directory of this package
const propertiesURL = 'packages://self-aware-components/properties/';
const propertyInspectors = fs.readdirSync(Editor.url(propertiesURL))
.map((fileName) => {
	// Add a cache busting query parameter for easing iteration on custom properties
	// Ideally this wouldn't be necessary, but it looks like the performance hit is only incurred
	//  when reloading the self-aware-components extension package
	return propertiesURL + fileName + "?t=" + Date.now();
});

return Vue.component('custom-property-component', {
	dependencies: dependencies.concat(propertyInspectors),

	template: `
		<div v-for="(propName, prop) in target">
			<pre v-if="debug && prop.attrs.visible !== false">{{propName}} will render as {{getCompType(prop)}}\n{{stringify(prop)}}</pre>
			<component :is="getCompType(prop)" :target.sync="prop" v-if="prop.attrs.visible !== false"></component>
		</div>
	`,

	data: function() {
		return {
			// Enable to see debug info about how a property selects a component type in the properties panel
			debug: false,
		};
	},

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
		getCompType(prop) {
			return Editor.SAG.ComponentUtils.getComponentType(prop);
		},
	},
});

})();
