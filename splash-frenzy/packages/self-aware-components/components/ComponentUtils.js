(() => {
	const ComponentUtils = {
		changePropValue(vueElem, prop, value) {
			prop.value = value;
			Editor.UI.fire(vueElem, "target-change", {
				bubbles: true,
				detail: {
					type: prop.type,
					path: prop.path,
					value: prop.value,
				},
			});
		}
	};
	return ComponentUtils;
})();