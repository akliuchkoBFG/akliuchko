/* eslint-env browser */
const previewControls = document.getElementById('playButtons');
const EnvProfile = Editor.remote.Profile.load("profile://local/environment-settings.json");
if (!previewControls.hasSAKit) {
	previewControls.hasSAKit = true;
	Editor.i18n.extend({
		'EDITOR_MAIN.preview.sakit': 'Casino Preview',
		'EDITOR_MAIN.preview.sakit-jms': 'JMS Preview',
		'EDITOR_MAIN.preview.sakit-facebook': 'FB Casino Preview',
	});
	const clients = [
		{value: 'sakit', text: 'EDITOR_MAIN.preview.sakit'},
		{value: 'sakit-jms', text: 'EDITOR_MAIN.preview.sakit-jms'},
		{value: 'sakit-facebook', text: 'EDITOR_MAIN.preview.sakit-facebook'},
	];
	previewControls.platformList = clients;
	if (previewControls.platform.indexOf('sakit') === -1) {
		Editor.log("Defaulting preview platform to 'Casino Preview' from " + previewControls.platform);
		previewControls.platform = 'sakit';
		previewControls.querySelector('#platforms > ui-select').value = 'sakit';
	}
	// Extend preview controls to send an event when the preview platform changes
	previewControls._platformChanged = (function(origPlatformChanged) {
		return function() {
			origPlatformChanged.call(this);
			EnvProfile.data.clientID = this.platform;
			EnvProfile.save();
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
	EnvProfile.data.previewBuildOnSave = buildOnSave.checked;
	EnvProfile.save();
});
buildOnSave.checked = EnvProfile.data.previewBuildOnSave;
previewControls.insertBefore(buildOnSave, previewControls.firstChild);

// Features Preview checkbox enables previewing features content in the running game on localVMs
// This setting defaults to off and intentionally does not persist and includes a warning when toggled on
//  to avoid developers getting complacent about publishing features content
const inGamePreviewWarning =
`Enabling features preview (localVM ONLY). Read below if you're not sure what this does!!!
Turning Features Preview on allows developers to see changes to the current preview scene when connecting to
Casino/JMS on your localVM. This enables you to test changes for a single scene in normal game flows without
publishing the scene and building SAKit bundles, you just need to build for preview.
Only the active scene can be previewed. If you also need to see changes from a different scene, publish it.

Please don't forget to publish when you are ready to push changes!
This setting will NOT persist when you close the editor.`;

const previewInGame = document.createElement('ui-checkbox');
previewInGame.id = 'previewInGame';
previewInGame.className = 'sakit-preview';
previewInGame.textContent = 'Features Preview';
// Hide this part of the UI by default, it gets enabled in asset-zip-build-features, an in-repo only package
previewInGame.style = "display:none;";
previewInGame.addEventListener('change', () => {
	const shouldPreview = previewInGame.checked;
	if (shouldPreview) {
		Editor.warn(inGamePreviewWarning);
	}
	Editor.Ipc.sendToMain('sakit-preview-server:change-preview-in-game', shouldPreview);
});
previewControls.insertBefore(previewInGame, previewControls.firstChild);

module.exports = {
	'env-profile-changed'() {
		if (previewControls) {
			previewControls.platform = EnvProfile.data.clientID;
		}
	},
};
