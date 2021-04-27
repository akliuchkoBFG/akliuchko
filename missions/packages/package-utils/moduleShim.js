// Helper for shimming a function definition on top of an object in a consistent way
// Also allows iterating on the shimmed function
// 
// e.g.
// moduleShim(object, 'someFunction', function(orig, arg1, arg2) {
// 	const origResult = orig(arg1, arg2); // Calls the original implementation of object.someFunction
// 	return modifyResult(origResult);
// });

function moduleShim(module, fnName, fn) {
	const ORIG_PREFIX = '__orig__';
	const origFnName = ORIG_PREFIX + fnName;
	// Save off the original function that is being shimmed over
	// Only do this the first time a module is shimmed to avoid recursively adding layers of shims
	if (!module[origFnName]) {
		module[origFnName] = module[fnName];
	}
	// Apply the desired shimmed implmentation, with the original function as the first argument
	module[fnName] = fn.bind(module, module[origFnName].bind(module));
}

module.exports = moduleShim;
