module.exports = cc.Class({
	name: 'EditorButtonProperty',
	properties: {
		title: {
			default: '',
		},
		listener: {
			default: false,
			notify() {
				this.performAction();
			}
		}
	},
	ctor() {
		this.title = arguments[0];
	},

	performAction() {
		if (typeof this.action !== 'function') {
			return Editor.error("Unable to perform editor button action, has the button action been set?");
		}
		this.action();
	},
});
