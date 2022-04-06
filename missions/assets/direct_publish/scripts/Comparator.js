const Comparators = cc.Enum({
	'=': 1,
	'≠': 2,
	'>': 3,
	'≥': 4,
	'<': 5,
	'≤': 6,
});

const enumCache = {};

function doComparison(comparator, value1, value2) {
	// Comparitor validation
	if (!Comparators[comparator]) {
		throw new Error('Invalid comparison operator ' + comparator);
	}
	// Force using the identifier not numerical value
	if (typeof comparator !== 'string') {
		comparator = Comparators[comparator];
	}
	let result;
	switch(comparator) {
		case '=':
			result = value1 === value2;
			break;
		case '≠':
			result = value1 !== value2;
			break;
		case '>':
			result = value1 > value2;
			break;
		case '≥':
			result = value1 >= value2;
			break;
		case '<':
			result = value1 < value2;
			break;
		case '≤':
			result = value1 <= value2;
			break;
	}
	return result;
}

module.exports = cc.Class({
	name: 'Comparator',
	statics: {
		AllComparators: Comparators,
		enumForComparators(comparatorList) {
			const cacheKey = comparatorList.join('');
			if (!enumCache[cacheKey]) {
				const enumOptions = {};
				comparatorList.forEach((comparator) => {
					if (!Comparators[comparator]) {
						return;
					}
					enumOptions[comparator] = Comparators[comparator];
				});
				enumCache[cacheKey] = cc.Enum(enumOptions);
			}
			return enumCache[cacheKey];
		},
		doComparison: doComparison,
	},
	properties: {
		comparator: {
			default: Comparators['='],
			type: Comparators,
		},
	},

	compareValues(value1, value2) {
		return doComparison(this.comparator, value1, value2);
	},
});
