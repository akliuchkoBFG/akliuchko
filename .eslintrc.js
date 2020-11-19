/* eslint-env node */
module.exports = {
	globals: { // false to disallow overwrite
		CC_EDITOR: false,
		CC_DEV: false,
		Editor: false,
		Vue: false,
		sp: false,
	},
	rules: {
		"no-console": 0,
		"comma-dangle": [0],
		"spaced-comment": 1,
		"no-unused-vars": [1, { vars: "local" }],
		"new-cap": [1, {capIsNewExceptions: ["Class", "Enum", "ComponentInspector"]}],
		"no-shadow": [1, {allow: ['resolve', 'reject', 'err']}],
	},
	env: {
		es6: true,
		node: true,
	},
	ecmaFeatures: {
		modules: true,
		experimentalObjectRestSpread: true
	},
	extends: ".eslintrc-sakit.js",
};