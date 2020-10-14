/* global
	Ipc
*/
const electron = require('electron');
const ipc = electron.ipcMain;
const Ipc = Editor.Ipc;

// Shim over Ipc.sendToWins to capture events that are only sent to the renderer thread
// This is a gross way to capture the compiler:state-changed event
try {
	Ipc._origSendToWins = Ipc._origSendToWins || Ipc.sendToWins;
	Ipc._sendToWinsIntercepts = Ipc._sendToWinsIntercepts || {};
	Ipc.sendToWins = function(message, ...args) {
		if (Array.isArray(Ipc._sendToWinsIntercepts[message])) {
			Ipc._sendToWinsIntercepts[message].forEach((interceptFn) => {
				interceptFn.apply(null, args);
			});
		}
		Ipc._origSendToWins.apply(this, arguments);
	};
} catch (e) {
	Editor.error("Error in asset watcher. Automatic preview builds will not work");
	Editor.error(e);
}

class AssetWatcher {
	constructor() {
		this.listeners = [];
		this._ipcListeners = [];
		this._interceptListeners = [];
		this._assetsChanged = false;
		this._pendingComiple = false;
		this._registerForAssetEvents();
	}

	listen(listener, target) {
		this.listeners.push({listener, target});
	}

	_emit() {
		this.listeners.forEach(({listener, target}) => {
			listener.call(target);
		});
		this._assetsChanged = false;
	}

	_registerForAssetEvents() {
		// this._ipcOn('compiler:state-changed', this._onCompilerStateChange);
		this._registerForIntercept('compiler:state-changed', this._onCompilerStateChange);
		this._ipcOn('asset-db:asset-changed', this._onAssetChange);
		this._ipcOn('asset-db:assets-created', this._onAssetChange);
		this._ipcOn('asset-db:assets-moved', this._onAssetChange);
		this._ipcOn('asset-db:assets-deleted', this._onAssetChange);
	}

	_registerForIntercept(message, handler) {
		if (!Ipc._sendToWinsIntercepts[message]) {
			Ipc._sendToWinsIntercepts[message] = [];
		}
		const listener = handler.bind(this);
		this._interceptListeners.push({listener, message});
		Ipc._sendToWinsIntercepts[message].push(listener);
	}

	_ipcOn(message, handler) {
		const listener = handler.bind(this);
		this._ipcListeners.push({listener, message});
		ipc.on(message, listener);
	}

	_onCompilerStateChange(state) {
		if (state === 'compiling') {
			this._pendingComiple = true;
		} else {
			this._pendingComiple = false;
			if (this._assetsChanged) {
				this._emit();
			}
		}
	}

	_onAssetChange(event, assetOrArray) {
		this._assetsChanged = true;
		// Check for scripts, which should defer notification until compiled
		let hasScript = false;
		if (!Array.isArray(assetOrArray)) {
			assetOrArray = [assetOrArray];
		}
		assetOrArray.forEach((asset) => {
			hasScript |= (asset.type && Editor.QuickCompiler.isScript(asset.type));
		});
		if (!hasScript) {
			this._emit();
		}
	}

	cleanup() {
		this._unregisterAssetEvents();
		this.listeners = [];
	}

	_unregisterAssetEvents() {
		this._ipcListeners.forEach(({listener, message}) => {
			ipc.removeListener(message, listener);
		});
		this._ipcListeners = [];
		this._interceptListeners.forEach(({listener, message}) => {
			const index = Ipc._sendToWinsIntercepts[message].indexOf(listener);
			Ipc._sendToWinsIntercepts[message].splice(index, 1);
		});
		this._interceptListeners = [];
	}
}

module.exports = AssetWatcher;