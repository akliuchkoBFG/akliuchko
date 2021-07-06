const StylePropertyType = cc.Enum({
	color: 1,
});

module.exports = cc.Class({
	name: 'StyleProperty',

	statics: {
		Type: StylePropertyType,
	},

	properties: {
		propertyName: {
			default: '',
			readonly: true, // Initial UI should have an interface for creating valid properties
			tooltip: [
				'Name of the style property, this determines what the property value does',
				'Different components may have different ways to interact with style values based on property names',
			].join('\n'),
		},
		propertyType: {
			default: StylePropertyType.color,
			type: StylePropertyType,
			readonly: true,
			visible: false, // Revisit if/when more property types get added
		},
		color: {
			default: cc.Color.WHITE,
			visible() {
				return this.propertyType === StylePropertyType.color;
			},
		},
	},

	ctor(/* name, type */) {
		if (typeof arguments[0] === 'string') {
			this.propertyName = arguments[0];
		}
		if (typeof arguments[1] === 'string') {
			this.propertyType = StylePropertyType[arguments[1]];
		}
	},
});