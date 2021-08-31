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
		if (CC_EDITOR) {
			this._stringUpdatedExpected = true;
			this._previewTestData();
			this.getComponent(cc.RichText).node.on('size-changed', this.onRichTextUpdate, this);
		}
	},

	// Editor only, watch for updates to other string fields as this component should be the source of truth
	onRichTextUpdate() {
		if (!this._stringUpdateExpected) {
			const styleComponent = this.getComponent('RichTextStyle');
			if (styleComponent) {
				if (
					styleComponent.styleString !== this._tokenizedString
					|| this.getComponent(cc.RichText).string !== styleComponent.getStyledString()
				) {
					cc.error("Oops! It looks like you're not editing the Template String field");
					styleComponent.styleString = this._tokenizedString;
				}
			} else if (this.getComponent(cc.RichText).string !== this._tokenizedString) {
				cc.error("Oops! It looks like you're not editing the Template String field");
				this.getComponent(cc.RichText).string = this._tokenizedString;
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

		const styleComponent = this.getComponent('RichTextStyle');
		if (styleComponent) {
			// Prefer forwarding tokenized string to style components where available
			// Style components do tag replacement before updating rich text labels
			styleComponent.styleString = this._tokenizedString;
		} else {
			this.getComponent(cc.RichText).string = this._tokenizedString;
		}
		if (CC_EDITOR) {
			this._stringUpdateExpected = true;
		}
	},
});