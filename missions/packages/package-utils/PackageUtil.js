const Promise = require('bluebird');

// Create an error type that's more resilient than the standard error object to being serialized over IPC
function IPCError(message, type, data) {
	this.message = message;
	this.type = type;
	this.data = data;
}
IPCError.prototype = Object.create(Error.prototype);

class PackageUtil {
	constructor(packageName, timeout) {
		this.packageName = packageName;
		this.timeout = timeout || 30e3; // Default IPC timeout of 30 seconds
	}
	callSceneScript(message, ...args) {
		return new Promise((resolve, reject) => {
			Editor.Scene.callSceneScript(this.packageName, message, ...args, (err, result) => {
				if (err) {
					if (!(err instanceof Error)) {
						// Fix up errors that get lost across the IPC bridge
						const msg = err.message || 'PackageUtil.callSceneScript unknown error. Use PackageUtil.IPCError';
						err = new IPCError(msg, err.type, err);
					}
					reject(err);
				}
				resolve(result);
			}, this.timeout);
		});
	}
	sendToPackage(message, ...args) {
		return new Promise((resolve, reject) => {
			Editor.Ipc.sendToMain(`${this.packageName}:${message}`, ...args, (err, result) => {
				if (err) {
					if (!(err instanceof Error)) {
						// Fix up errors that get lost across the IPC bridge
						const msg = err.message || 'PackageUtil.sendToPackage unknown error. Use PackageUtil.IPCError';
						err = new IPCError(msg, err.type, err);
					}
					reject(err);
				}
				resolve(result);
			}, this.timeout);
		});
	}
}
PackageUtil.IPCError = IPCError;
module.exports = PackageUtil;
