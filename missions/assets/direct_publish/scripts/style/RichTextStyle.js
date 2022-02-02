const TAG = "RichTextStyle";
const ComponentLog = require('ComponentSALog')(TAG);
const BaseStyle = require('BaseStyle');
const StyleProperty = require('StyleProperty');
const EditorButtonProperty = require('EditorButtonProperty');

const LabelTypes = cc.Enum({
	normal: 1,
	shadow: 2,
});

const ColorPropNames = cc.Enum({
	textColor: 1,
	textShadowColor: 2,
});

const TAG_REGEX = /\<(\/?)style-(.*?)\>/g;

cc.Class({
	extends: BaseStyle,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		executeInEditMode: true,
		menu: 'Labels/Style/Rich Text Style',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
		requireComponent: cc.RichText,
	},

	// Deferred property initialization so that the parentStyle property can reference this class
	properties: () => ({
		labelType: {
			default: LabelTypes.normal,
			type: LabelTypes,
			tooltip: "Type of label determines which style values to use for this rich text",
			notify() {
				this._updateRichText();
			},
		},
		styleString: {
			default: '',
			tooltip: "String that supports dynamic replacement of style tags like <style-primary>",
			multiline: true,
			notify() {
				this._updateRichText();
			},
		},
		// Editor validation of style string against linked style definitions
		validateButton: {
			default: function() {
				return new EditorButtonProperty('Validate');
			},
			serializable: false,
			type: EditorButtonProperty,
			tooltip: 'Check style string for valid style tags. Warnings will be output in the Console panel.',
		},
	}),

	__preload() {
		this._super();
		if (CC_EDITOR) {
			this.validateButton.action = this.validateString.bind(this);
		}
	},

	// Respond to style refresh button for changing a stlye without reloading the scene
	onStyleUpdate() {
		this._updateRichText();
	},

	validateString() {
		if (CC_EDITOR) {
			let valid = true;
			const styles = this.getStylesByName();
			this.styleString.replace(TAG_REGEX, (tag, closeMarker, styleName) => {
				const style = styles[styleName];
				if (!style) {
					Editor.warn("Style not defined for name: " + styleName);
					valid = false;
				} else {
					valid = valid && this._validateProperties(style);
				}
			});
			if (valid) {
				Editor.success("Rich text styling validated, no warnings found!");
			}
		}
	},

	_validateProperties(style) {
		let valid = true;
		if (CC_EDITOR) {
			const expectedProperties = ['textColor', 'textShadowColor'];
			expectedProperties.forEach((propName) => {
				if (!style.getProperty(propName)) {
					Editor.warn(`Missing expected property ${propName} in style ${style.styleName}`);
					valid = false;
				}
			});
		}
		return valid;
	},

	getStyledString() {
		const styles = this.getStylesByName();
		const string = this.styleString.replace(TAG_REGEX, (tag, closeMarker, styleName) => {
			const isClosing = closeMarker === '/';
			return this._getTagForStyle(styles[styleName], isClosing);
		});
		return string;
	},

	_updateRichText() {
		try {
			this.getComponent(cc.RichText).string = this.getStyledString();
		} catch (e) {
			this.log.e("Failed to update rich text with style string\n" + e);
		}
	},

	// Construct a rich text tag from a given style definition
	// Uses the opening/closing tag status to return the corresponding markup
	_getTagForStyle(styleDef, isClosing) {
		if (!styleDef) {
			// Named style not configured, ignore this style tag
			return '';
		}
		// Get text color based on label type
		const colorProp = ColorPropNames[this.labelType];
		const prop = styleDef.getProperty(colorProp);
		return this._getTagForProp(prop, isClosing);
	},

	// Construct a rich text tag from a single style property
	// Supports: <color>
	_getTagForProp(styleProp, isClosing) {
		if (!styleProp) {
			return '';
		}
		const propType = StyleProperty.Type[styleProp.propertyType];
		switch(propType) {
			case 'color':
				if (isClosing) {
					return '</color>';
				} else {
					return `<color=${cc.colorToHex(styleProp.color)}>`;
				}
				break;
			default:
				this.log.w("Unknown rich text style property type: " + propType);
				break;
		}
		return '';
	},
});

module.exports = BaseStyle;