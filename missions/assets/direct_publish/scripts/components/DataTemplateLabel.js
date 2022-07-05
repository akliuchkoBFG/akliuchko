const TAG = "DataTemplateLabel";
const ComponentLog = require('ComponentSALog')(TAG);

const PROPERTY_REGEX = /{(.*?)}/g;

const SceneDataAggregator = require('SceneDataAggregator');

/**
 * Implements strategy pattern for different formatting methods.
 * The format maethod is the main public interface for DataTemplateLabel to
 * use this class.
 */
const FormatBehavior = cc.Class({
	name: "FormatBehavior",
	mixins:[ComponentLog],
	
	// Use short number formatting with no appended string or truncated decimals
	_format_numberAsShortString(string){
		return SAStringUtil.numberAsShortString(string);
	},

	// Format seconds into hours, minutes, and seconds
	_format_secondsAsDuration(string){
		const time = this._secondsBreakdown(string);
		return (time.hours !== 0 ? time.hours + " hours" : "")
			+ (time.minutes !== 0 ? time.minutes + " minutes" : "")
			+ (time.seconds !== 0 ? time.seconds + " seconds" : "");
	},

	// Format seconds into hours, minutes, and seconds using shortened words
	_format_secondsAsShortDuration(string){
		const time = this._secondsBreakdown(string);
		return (time.hours !== 0 ? time.hours + " hr" : "")
			+ (time.minutes !== 0 ? time.minutes + " min" : "")
			+ (time.seconds !== 0 ? time.seconds + " sec" : "");
	},

	// Capitalize all letters
	_format_uppercase(string){
		return string.toUpperCase();
	},

	// Lowercase all letters
	_format_lowercase(string){
		return string.toLowerCase();
	},

	// Capitalize each word separated by a space
	_format_titlecase(string){
		let words = string.split(" ");
		words = _.map(words, function(word){
			word = word.charAt(0).toUpperCase() + word.slice(1);
			return word;
		});
		return words.join(" ");
	},

	// Public interface to use a formatting strategy
	format(string, strategyName){
		const strategy = "_format_" + strategyName;
		if (typeof this[strategy] !== 'function') {
			this.log.e("Undefined format behavior: " + strategy);
			return string;
		} else {
			return this[strategy](string);
		}
	},

	// Take a value in raw seconds and seperate it into hours, minutes, and seconds
	_secondsBreakdown(value){
		var hours = 0, minutes = 0, seconds = 0;
		var current = value;
		// If we have over an hour worth of seconds
		if(current >= 3600){
			hours = current/3600;
			current = current % 3600;
		}
		// If we have over a minute of remaining seconds
		if(current >= 60){
			minutes = current/60;
			current = current % 60;
		}
		seconds = current;
		return {
			hours:hours,
			minutes:minutes,
			seconds:seconds
		};
	}
});


cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		requireComponent: cc.Label,
		executeInEditMode: true,
		menu: "Labels/Data Template Label",
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
			let properties = propertyName.split('|');
			let mappedTemplateValue = combinedData[properties[0]];
			// Remove the first element which is the property template name, leaving only the formatting options
			properties = properties.slice(1);
			const formatter = new FormatBehavior();
			properties.forEach(function(formatStrategy){
				mappedTemplateValue = formatter.format(mappedTemplateValue, formatStrategy);
			});
			return mappedTemplateValue != null ? mappedTemplateValue : '';
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