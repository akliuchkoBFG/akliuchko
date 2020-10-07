module.exports = cc.Class({
	name: 'EditorLabelProperty',
	properties: {
		text: {
			default: '',
		},
	},
	ctor() {
		this.text = arguments[0];
	},
});
