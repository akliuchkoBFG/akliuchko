const FormatTypes = cc.Enum({
	'None': 0,
	'Commafy': 1,
	'Short String': 2,
});

const HideStrategy = cc.Enum({
	'None': 0,
	'≤ 0': 1,
	'≤ 1': 2,
});

const TOKEN_STRING = '{#}';

cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.Label,
		// TODO executeInEditMode to allow preview (needs SAStringUtil shim)
	},

	properties: {
		formatType: {
			default: FormatTypes.None,
			type: FormatTypes,
		},
		format: {
			default: TOKEN_STRING,
			tooltip: 'Format string for including additional text surrounding the {#} token\nIgnored if {#} token is not present'
		},
		hideStrategy: {
			default: HideStrategy.None,
			type: HideStrategy,
			tooltip: 'Optionally hide this label based on the numeric value of this label',
		},
	},

	setNumber(value) {
		value = +value;
		let number;
		if (this.formatType === FormatTypes.Commafy) {
			number = SAStringUtil.formatNumber(value);
		} else if (this.formatType === FormatTypes['Short String']) {
			number = SAStringUtil.numberAsShortStringRoundedDown(value);
		} else {
			number = '' + value;
		}

		const string = this._tokenize(number);
		this.getComponent(cc.Label).string = string;
		this._activateByValue(value);
	},

	_activateByValue(value) {
		let active = true;
		const strategy = HideStrategy[this.hideStrategy];
		if (strategy === '≤ 0') {
			if (value <= 0) {
				active = false;
			}
		} else if (strategy === '≤ 1') {
			if (value <= 1) {
				active = false;
			}
		}
		this.node.active = active;
	},

	_tokenize(number) {
		if (!this.format || this.format.indexOf(TOKEN_STRING) === -1) {
			return number;
		}
		return this.format.replace(TOKEN_STRING, number);
	},
});
