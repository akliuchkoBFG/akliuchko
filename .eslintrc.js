/* eslint-env node */
module.exports = {
	globals: { // false to disallow overwrite
		Editor: false,
		Vue: false,
	},
	rules: {
		"no-console": 0,
		"comma-dangle": [0],
		"spaced-comment": 1,
		"no-unused-vars": [1, { "vars": "local" }],
	},
	"env": {
		"es6": true,
		"node": true,
	},
	"ecmaFeatures": {
		"modules": true,
		"experimentalObjectRestSpread": true
	},
	"extends": "eslint:recommended",
};
