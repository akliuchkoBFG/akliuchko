const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const PROPERTY_REGEX = /{(.*?)}/g;
const TAG_REGEX = /\<(\/?)(.*?)\>/g;

cc.Class({
	extends: DataTemplateRichTextLabel,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.Label,
		executeInEditMode: true,
		help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/619675711/Data+Template+Rich+Text+Label',
		menu: 'Labels/Data Template Strip Rich Text',
	},

	onLoad() {
		if (CC_EDITOR) {
			this._stringUpdatedExpected = true;
			this._previewTestData();
			this.getComponent(cc.Label).node.on('size-changed', this.onTextUpdate, this);
		}
	},

	// Editor only, watch for updates to other string fields as this component should be the source of truth
	onTextUpdate() {
		if (!this._stringUpdateExpected) {
			if (this.getComponent(cc.Label).string !== this._tokenizedString) {
				cc.error("Oops! It looks like you're not editing the Template String field");
				this.getComponent(cc.Label).string = this._tokenizedString;
			}
		}
		this._stringUpdateExpected = false;
	},

	setData(data) {
		let combinedData = data;
		if(this.sceneDataAggregator) {
			combinedData = _.merge({}, this.sceneDataAggregator.getSceneData(), data);
		}
		this._tokenizedString = this.templateString.replace(PROPERTY_REGEX, (match, propertyName) => {
			return (combinedData[propertyName] == null) ? '' : combinedData[propertyName];
		});
		// Strip out all style tags
		this._tokenizedString = this._tokenizedString.replace(TAG_REGEX, '');

		this.getComponent(cc.Label).string = this._tokenizedString;

		if (CC_EDITOR) {
			this._stringUpdateExpected = true;
		}
	},
});