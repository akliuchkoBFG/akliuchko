const TAG = "BaseStyle";
const ComponentLog = require('ComponentSALog')(TAG);
const StyleDefinition = require('StyleDefinition');
const EditorButtonProperty = require('EditorButtonProperty');

const BaseStyle = cc.Class({
	extends: cc.Component,

	mixins: [ComponentLog, cc.EventTarget],

	editor: CC_EDITOR && {
		executeInEditMode: true,
		menu: 'Labels/Style/Base Style',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	// Deferred property initialization so that the parentStyle property can reference this class
	properties: () => ({
		// Button allows manually updating components that reference these styles
		// This bypasses some of the complex nested logic it would take to update automatically
		//  from an arbitrary list of properties and named styles (in-editor array watching is subpar)
		refreshButton: {
			default: function() {
				return new EditorButtonProperty('Refresh Styles');
			},
			serializable: false,
			type: EditorButtonProperty,
			tooltip: 'Refresh elements that use these styles. Useful after changing a style value or adding a new named style below',
		},

		// Style props
		styles: {
			default: [],
			type: [StyleDefinition],
			tooltip: 'List of named styles',
		},

		// Parent style supports cascading
		parentStyle: {
			default: null,
			type: BaseStyle,
			tooltip: "Parent style component allows referencing a global style for style names or properties not defined on this component",
			notify(prev) {
				if (prev) {
					prev.targetOff(this);
				}
				this._listenForParentUpdate();
			}
		},
	}),

	__preload() {
		if (CC_EDITOR) {
			this.refreshButton.action = this._refreshStyles.bind(this);
		}
		this._listenForParentUpdate();
	},

	_refreshStyles() {
		this.onStyleUpdate();
		// Emit event for child style components
		this.emit('style.update');
	},

	_listenForParentUpdate() {
		if (this.parentStyle) {
			this.parentStyle.on('style.update', this._refreshStyles, this);
		}
	},

	// Respond to style component refresh events
	onStyleUpdate() {
		// Override to handle refresh events
	},

	addStyle() {
		const style = new StyleDefinition();
		style.resetToDefaultStyles();
		this.styles.push(style);
	},

	getStylesByName() {
		const stylesByName = this.parentStyle ? this.parentStyle.getStylesByName() : {};
		this.styles.forEach((styleDef) => {
			const parentStyle = stylesByName[styleDef.styleName] || new StyleDefinition();
			const style = StyleDefinition.concat(parentStyle, styleDef);
			stylesByName[styleDef.styleName] = style;
		});
		return stylesByName;
	},
});

module.exports = BaseStyle;