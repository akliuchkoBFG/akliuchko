const DataTemplateLabel = require('DataTemplateLabel');
const PROPERTY_REGEX = /{(.*?)}/g;

cc.Class({
	extends: DataTemplateLabel,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.RichText,
		executeInEditMode: true,
	},

	setData(data) {
		const tokenizedString = this.templateString.replace(PROPERTY_REGEX, (match, propertyName) => {
			return (data[propertyName] == null) ? '' : data[propertyName];
		});
		this.getComponent(cc.RichText).string = tokenizedString;
	},
});