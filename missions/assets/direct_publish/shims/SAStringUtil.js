// Duplicated from client/SAKit/Src/SAStringUtil.js
(function() {
'use strict';
var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

var SAStringUtil = {

	fileExtension : function (filename) {
		var a = filename.split(".");
		if (a.length == 1 || (a[0] = "" && a.length == 2)) {
			return "";
		}
		return a.pop().toLowerCase();
	},

	numberAsShortString : function (number, appendString, truncateDecimals) {
		var powerSymbols = ["", "K", "M", "B", "T", "Q", "X"];
		number = parseInt(number);

		if (!appendString) {
			appendString = "";
		}

		if (number < 0) {
			appendString = sprintf("-%s", appendString);
			number *= -1;
		}
		// Reduce size of iNum
		var power = 0;
		if (number < 1000) {
			return sprintf("%s%.0f%s", appendString, number, powerSymbols[power]);
		} else {
			power++;
		}
		while (number >= 1000000) {
			power++;
			number /= 1000;
		}
		if (power >= powerSymbols.length) {
			power = powerSymbols.length - 1;
		}
		
		var flooredValue = Math.floor(number);
		var decimalPlaces = 0;
		
		if (number == 0) {
			return "0";
		} else if (number < 10000 && (flooredValue % 100)) {
			decimalPlaces = 2;
		} else if (number < 100000 && (flooredValue % 1000)) {
			decimalPlaces = 1;
		} else if (number < 1000000) {
			decimalPlaces = 0;
		} else {
			return "";
		}

		var dividedNumber = number / 1000.0;
		if (truncateDecimals) {
			dividedNumber = Math.floor(number / Math.pow(10, 3 - decimalPlaces)) / Math.pow(10, decimalPlaces);
		}
		return sprintf("%s%." + decimalPlaces + "f%s", appendString, dividedNumber, powerSymbols[power]);
	},

	numberAsShortStringRoundedDown: function numberAsShortStringRoundedDown(number) {
		number = Math.floor(number);
		var roundToDigitCount = number.toString().length - 3; 
		var roundedNumber = Math.floor(number / Math.pow(10, roundToDigitCount)) * Math.pow(10, roundToDigitCount);

		return SAStringUtil.numberAsShortString(roundedNumber);
	},

	capitalize : function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	uncapitalize : function (string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	},

	capitalizeFirstLetter : function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	truncateWithEllipsis : function (string, max) {
		return string.length > max ? string.slice(0, max) + "…" : string;
	},
	
	// Format a number (add commas to large numbers)
	formatNumber : function(number) {
		if (!number) {
			return '0';
		}
		return Math.max(0, number).toFixed(0).replace(/(?=(?:\d{3})+$)(?!^)/g, ',');
	},

	tokenize: function tokenize(label, tokens, defaultFormatFunction) {
		defaultFormatFunction = defaultFormatFunction || function(text) { return text; };

		var text = label.getText();
		_(tokens).forEach(function(value, token) {
			var content = value.func ? value.func(value.content) : defaultFormatFunction(value);
			text = text.replace('%' + token, content);
		});

		label.setText(text);
	},

	numAsAbbrevString : function(num, format) {
		if (num === 0) {
			return 0;
		}

		format = format || 'medium';
		var precision,
			powerSymbols = ["", "K", "M", "B", "T", "Q", "X", null];
		var result = "";

		// set significant digit accuracy
		if (format === 'short') {
			precision = 3;
		} else {
			precision = 4;
		}

		if (num < 0) {
			result += "-";
			num *= -1;
		}

		// Reduce size of num
		var power = 0;
		if (num < 1000) {
			return result + num + powerSymbols[power];
		}
		else {
			power++;
		}

		while (num >= 1000000) {
			power++;
			num /= 1000;
		}
		if (power >= powerSymbols.length) {
			power = powerSymbols.length - 1;
		}

		if (num === 0) {
			return "0";
		}
		else if (num < 10000 && (num % 10)) {
			num = Math.floor(num) / 1000;
		}
		else if (num < 100000 && (num % 100)) {
			num = Math.floor(num / 10) / 100;
		}
		else if (num < 1000000 && (num % 1000)) {
			num = Math.floor(num / 100) / 10;
		}
		else {
			num /= 1000;
		}

		if (num.toString().length > precision) {
			num = num.toPrecision(precision);
		}
		return result + num + powerSymbols[power];
	},

	getOrdinalSuffixOf: function getOrdinalSuffixOf(i) {
		var j = i % 10,
		k = i % 100;
		if (j == 1 && k != 11) {
			return 'st';
		}
		if (j == 2 && k != 12) {
			return 'nd';
		}
		if (j == 3 && k != 13) {
			return 'rd';
		}
		return 'th';
	},

	militaryToStandardTime: function militaryToStandardTime(hour) {
		var suffix = 'am';
		if (hour >= 12) {
			suffix = 'pm';
			hour -= 12;
		}
		if (hour === 0) {
			hour = 12;
		}
		return hour + suffix;
	},

	// Options
	// - showSeconds: Display seconds after minutes.
	// - showHours: Display hours before minutes.
	formatTime: function formatTime(milliseconds, options) {
		// Provide defaults.
		milliseconds = (milliseconds ? milliseconds : 0);
		options = _.assign({ showSeconds: true, showHours: false, showZeroHours: false}, options);

		// Calculate seconds, minutes, and hours from milliseconds.

		var seconds = Math.ceil(milliseconds / 1000);

		var minutes = seconds / 60;
		var hours = Math.floor(minutes / 60);
		minutes = (options.showSeconds ? Math.floor(minutes) : Math.ceil(minutes));
		if (options.showHours) {
			minutes -= hours * 60;
		}
		seconds %= 60;

		// Section time into desirable segments.

		var segments = [];
		if (options.showHours && (hours > 0 || options.showZeroHours)) {
			segments.push(hours);
		}

		segments.push(minutes);

		if (options.showSeconds) {
			segments.push(seconds);
		}

		// Stringify and join time segments with colons.
		return _(segments).map(function (val) {
			var strVal = '' + val;
			while (strVal.length < 2) {
				strVal = '0' + strVal;
			}
			return strVal;
		}, this).join(':');
	},

	// Returns time formatted with the highest units of time, rounded down
	// units var specifies how many units to use
	// ex. (100000000, 1) = 9 days
	//     (100000000, 2) = 9 days, 6 hours
	//     (100000000, 3) = 9 days, 6 hours, 10 minutes
	//     (100000000, 4) = 9 days, 6 hours, 10 minutes, 40 seconds
	formatTimeToWords: function formatTimeToWords(milliseconds, units, useShortName) {
		if (units <= 0) {
			return '';
		}

		var measurements = [
			{name: 'second', shortName: 's', value: 1000},
			{name: 'minute', shortName: 'm', value: 60},
			{name: 'hour', shortName: 'h', value: 60},
			{name: 'day', shortName: 'd', value: 24},
			{name: 'week', shortName: 'w', value: 7}
		];

		if (milliseconds < measurements[0].value) {
			return useShortName ? '0s' : '0 seconds';
		}

		var measurementIndex = 0;
		var timeLeft = Math.ceil(milliseconds);
		var timeLeftInMillisecondsScalar = 1;

		for (measurementIndex = 0; measurementIndex < measurements.length; ++measurementIndex) {
			var measurement = measurements[measurementIndex];
			var newTimeLeft = timeLeft / measurement.value;
			if (Math.floor(newTimeLeft) < 1) {
				break;
			}

			timeLeft = newTimeLeft;
			timeLeftInMillisecondsScalar *= measurement.value;
		}

		--measurementIndex;
		timeLeft = Math.floor(timeLeft);

		var nextFormattedTime = SAStringUtil.formatTimeToWords(milliseconds - timeLeft * timeLeftInMillisecondsScalar, units - 1);
		nextFormattedTime = (nextFormattedTime !== '' ? ', ' + nextFormattedTime : '');
		var measurementFormattedText = useShortName ? measurements[measurementIndex].shortName :
													(' ' + measurements[measurementIndex].name + (timeLeft === 1 ? '' : 's'));

		return timeLeft + measurementFormattedText + nextFormattedTime;
	},

	// Counts the length of a string taking into account surrogate pairs
	// countSymbols('😃😃') returns 2 instead of 4 (each emoji is 2 characters wide)
	countSymbols: function countSymbols(string) {
		return string
			.replace(regexAstralSymbols, '_')
			.length;
	},

	// Gets the character(s) at index taking into account surrogate pairs
	// unicodeCharAt('😃😃', 1) returns 😃 instead of � (half an emoji)
	unicodeCharAt: function unicodeCharAt(string, index) {
		var first = string.charCodeAt(index);
		var second;
		if (first >= 0xD800 && first <= 0xDBFF && string.length > index + 1) {
			second = string.charCodeAt(index + 1);
			if (second >= 0xDC00 && second <= 0xDFFF) {
				return string.substring(index, index + 2);
			}
		}
		return string[index];
	},

	// Slices a string taking into account surrogate pairs
	// unicodeSlice('😃😃😃😃', 0, 3) returns 😃😃😃 instead of 😃� (1.5 emoji)
	unicodeSlice: function unicodeSlice(string, start, end) {
		start = start != null ? start : 0;
		end = end != null ? end : string.length;
		var accumulator = "";
		var character;
		var stringIndex = 0;
		var unicodeIndex = 0;
		var length = string.length;

		while (stringIndex < length) {
			character = SAStringUtil.unicodeCharAt(string, stringIndex);
			if (unicodeIndex >= start && unicodeIndex < end) {
				accumulator += character;
			}
			stringIndex += character.length;
			unicodeIndex += 1;
		}
		return accumulator;
	},
};

global.SAStringUtil = SAStringUtil;

})();