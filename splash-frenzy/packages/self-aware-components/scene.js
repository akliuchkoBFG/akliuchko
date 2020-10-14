/* eslint-env browser */

// Shim around some nonsense that doesn't allow for iterating on Component inspector files
// This shim allows a developer to change the editor.inspector property to include an anti-cache URL parameter
// at the end of the url (e.g. editor.inspector = inspectorURL + "?t=" + Date.now()) to see inspector updates
// without requiring an editor restart
// After making changes to the Vue component, save the corresponding cc.Component (game logic) file to recompile
// the inspector and reload with the new Vue component inspector
// The cache busting portion of the inspector URL should be removed after development completes
if (!Editor.UI._importResourceCacheBustScripts) {
	Editor.UI._importResourceCacheBustScripts = Editor.UI.importResource;
	const path = require('path');
	Editor.UI.importResource = function(resourcePath) {
		if (path.extname(resourcePath).indexOf('.js?') === 0) {
			// Import this resource as a script rather than a string
			return Editor.UI.importScript(resourcePath);
		} else {
			// Call the original implementation
			return Editor.UI._importResourceCacheBustScripts(resourcePath);
		}
	};
}

// No scene messages
module.exports = {};
