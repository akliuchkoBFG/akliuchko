/* eslint-env browser */
const profilePath = "profile://local/asset-zip-build-settings.json";
const previewControls = document.getElementById('playButtons');
if (!previewControls.hasSAKit) {
	previewControls.hasSAKit = true;
	Editor.i18n.extend({
		'EDITOR_MAIN.preview.sakit': 'Casino Preview',
		'EDITOR_MAIN.preview.sakit-jms': 'JMS Preview',
		'EDITOR_MAIN.preview.sakit-facebook': 'FB Casino Preview',
	});
	previewControls.platformList.push({value: 'sakit', text: 'EDITOR_MAIN.preview.sakit'});
	previewControls.platformList.push({value: 'sakit-jms', text: 'EDITOR_MAIN.preview.sakit-jms'});
	previewControls.platformList.push({value: 'sakit-facebook', text: 'EDITOR_MAIN.preview.sakit-facebook'});
	// Force the ui-select to regenerate the options list
	previewControls.platformList = JSON.parse(JSON.stringify(previewControls.platformList));
	if (previewControls.platform.indexOf('sakit') === -1) {
		Editor.log("Defaulting preview platform to 'Casino Preview' from " + previewControls.platform);
		previewControls.platform = 'sakit';
		previewControls.querySelector('#platforms > ui-select').value = 'sakit';
	}
	// Extend preview controls to send an event when the preview platform changes
	previewControls._platformChanged = (function(origPlatformChanged) {
		return function() {
			origPlatformChanged.call(this);
			Editor.Ipc.sendToMain('preview-controls:platform-changed', this.platform);
		};
	})(previewControls._platformChanged);
}

// Remove existing build interface
Array.from(previewControls.querySelectorAll('.sakit-preview'))
.forEach((el) => {
	el.remove();
});

// Add build interface controls
// Preview build button starts a preview build immediately
const buildButton = document.createElement('ui-button');
buildButton.id = 'previewBuildButton';
buildButton.textContent = 'Build';
buildButton.className = 'sakit-preview btn style-scope app-play-buttons';
buildButton.addEventListener('click', () => {
	Editor.Ipc.sendToMain('sakit-preview-server:build-for-preview');
});

previewControls.insertBefore(buildButton, previewControls.firstChild);

// Build on Save checkbox enables/disables automatic preview builds when saving or changing assets
const buildOnSave = document.createElement('ui-checkbox');
buildOnSave.id = 'buildOnSave';
buildOnSave.className = 'sakit-preview';
buildOnSave.textContent = 'Build on Save';
buildOnSave.addEventListener('change', () => {
	Editor.Profile.load(profilePath, (e, profile) => {
		profile.data["preview-build-on-save"] = buildOnSave.checked;
		profile.save();
		Editor.Ipc.sendToMain('sakit-preview-server:change-build-on-save');
	});
});
previewControls.insertBefore(buildOnSave, previewControls.firstChild);

// Load profile for determine current build on save setting
Editor.Profile.load(profilePath, (e, profile) => {
	buildOnSave.checked = profile.data["preview-build-on-save"];
});

// No scene messages
module.exports = {};
