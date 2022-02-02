const SystemFonts = cc.Enum({
	"Lato-Medium": 1,
	"Lato-Bold": 2,
	"Lato-Light": 3,
	"Lato-MediumItalic": 4,
});

cc.Class({
	extends: cc.Component,
	editor: {
		disallowMultiple: true,
		requireComponent: cc.Label,
		executeInEditMode: true,
		menu: 'Labels/System Font',
	},
	properties: {
		font: {
			default: SystemFonts['Lato-Medium'],
			type: SystemFonts,
			notify() {
				this._updateLabel();
			},
		},
	},

	onLoad() {
		if (CC_EDITOR) {
			const font = this.getComponent(cc.Label).fontFamily;
			if (SystemFonts[font]) {
				this.font = SystemFonts[font];
			} else {
				this._updateLabel();
			}
		} else {
			this._updateLabel();
		}
	},

	_getFont() {
		if (CC_EDITOR || appPlatform === 'Web') {
			return SystemFonts[this.font];
		} else {
			return "Art/Fonts/" + SystemFonts[this.font] + ".ttf";
		}
	},

	_updateLabel() {
		const label = this.getComponent(cc.Label);
		const font = this._getFont();
		label.fontFamily = font;
		label.useSystemFont = true;
	},
});