const StyleProperty = require('StyleProperty');
const EditorButtonProperty = require('EditorButtonProperty');

const StyleDefinition = cc.Class({
	name: 'StyleDefinition',

	statics: {
		concat(parent, child) {
			const result = new StyleDefinition();
			result.styleName = child.styleName;
			const propertyNames = [];
			// Include all properties from the child style definition
			// These take priority over anything defined in the parent
			child.styleValues.forEach((styleProp) => {
				result.styleValues.push(styleProp);
				propertyNames.push(styleProp.propertyName);
			});
			// Include only undefined property values from the parent style
			parent.styleValues.forEach((styleProp) => {
				if (propertyNames.indexOf(styleProp.propertyName) === -1) {
					result.styleValues.push(styleProp);
					propertyNames.push(styleProp.propertyName);
				}
			});
			return result;
		}
	},

	properties: {
		styleName: {
			default: 'primary',
			tooltip: [
				'Name of the style, used to reference the style in other components',
				'e.g. the <style-primary> tag to reference the style named "primary" in a rich text',
			].join('\n'),
		},
		styleValues: {
			default: [],
			type: [StyleProperty],
			tooltip: [
				'List of style values that apply to this style',
			].join('\n'),
		},
		// Editor configuration helper
		defaultStyles: {
			default: function() {
				return new EditorButtonProperty('Reset Styles');
			},
			serializable: false,
			type: EditorButtonProperty,
			tooltip: 'Reset style property values to default style configuration',
		},
	},

	ctor() {
		if (this.styleValues.length === 0) {
			this.resetToDefaultStyles();
		}
		if (CC_EDITOR) {
			this.defaultStyles.action = this.resetToDefaultStyles.bind(this);
		}
	},

	resetToDefaultStyles() {
		const textColor = new StyleProperty('textColor', 'color');
		textColor.color = cc.Color.WHITE;
		const textShadowColor = new StyleProperty('textShadowColor', 'color');
		textShadowColor.color = cc.Color.BLACK;
		this.styleValues = [textColor, textShadowColor];
	},

	getProperty(propName) {
		let prop = null;
		// Find last index of this property
		for (var i = this.styleValues.length - 1; i >= 0; i--) {
			if (this.styleValues[i].propertyName === propName) {
				prop = this.styleValues[i];
				break;
			}
		}
		return prop;
	},
});

module.exports = StyleDefinition;
