const DataTemplateLabel = require('DataTemplateLabel');
const PROPERTY_REGEX = /{(.*?)}/g;

cc.Class({
	extends: DataTemplateLabel,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.RichText,
		executeInEditMode: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/619675711/Data+Template+Rich+Text+Label',
	},

	onLoad() {
		this._stringUpdatedExpected = true;
		this._tokenizedString = this.getComponent(cc.RichText).string;
		this.getComponent(cc.RichText).node.on('size-changed', this.onRichTextUpdate, this);
	},

	onRichTextUpdate() {
		if (CC_EDITOR && !this._stringUpdateExpected) {
			if (this.getComponent(cc.RichText).string != this._tokenizedString) {
				cc.error("Oops! It looks like you're editing the String field rather than the Template String field");
				this.getComponent(cc.RichText).string = this._tokenizedString;
			}
		}
		this._stringUpdateExpected = false;
	},

	setData(data) {
		this._tokenizedString = this.templateString.replace(PROPERTY_REGEX, (match, propertyName) => {
			return (data[propertyName] == null) ? '' : data[propertyName];
		});
		this.getComponent(cc.RichText).string = this._tokenizedString;
		this._stringUpdateExpected = true;
	},
});