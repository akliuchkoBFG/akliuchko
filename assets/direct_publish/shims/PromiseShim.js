// Shims for anything that needs to run in editor
// Hopefully these should be mostly non-functional since we should not be running crazy game logic from within the editor
// But where possible these shims will mimic bluebird promises

// A more correct Creator way to handle this would be to require bluebird in all files that use promises, but that affects bundling
// and causes Cocos Creator to use a different version of bluebird than SAKit

Promise.defer = function() {
	const deferred = {};
	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});
	return deferred;
};

Promise.prototype.cancel = function() {}; // eslint-disable-line no-extend-native
