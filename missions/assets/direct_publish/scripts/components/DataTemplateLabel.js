const PROPERTY_REGEX = /{(.*?)}/g;

const SceneDataAggregator = require('SceneDataAggregator');

cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.Label,
		executeInEditMode: true,
	},
	properties: {
		templateString: {
			default: '',
			multiline: true,
			tooltip: '{variableName} will be substituted with data properties, see referencing component for valid variable names',
			notify() {
				this._previewTestData();
			},
		},

		sceneDataAggregator: {
			default: null,
			type: SceneDataAggregator,
		},

		// Preview properties
		testData: {
			default: '{}',
			multiline: true,
			tooltip: 'Test JSON data for viewing the label in editor',
			editorOnly: true,
			notify() {
				this._previewTestData();
			},
		},
		_validPreview: {
			default: true,
			editorOnly: true,
		},
		validTestData: {
			get() {
				return JSON.stringify(this._validPreview);
			},
			readOnly: true,
			tooltip: 'Does the test data parse properly',
		},
	},

	setData(data) {
		let combinedData = data;
		if(this.sceneDataAggregator) {
			combinedData = _.merge({}, this.sceneDataAggregator.getSceneData(), data);
		}
		const tokenizedString = this.templateString.replace(PROPERTY_REGEX, (match, propertyName) => {
			return combinedData[propertyName] || '';
		});
		this.getComponent(cc.Label).string = tokenizedString;
	},

	_previewTestData() {
		try {
			const data = JSON.parse(this.testData);
			this.setData(data);
			this._validPreview = true;
		} catch(e) {
			this._validPreview = false;
		}
	},
});