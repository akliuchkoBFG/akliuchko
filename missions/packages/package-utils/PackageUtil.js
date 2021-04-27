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
						const errData = err;
						err = new Error('PackageUtil.callSceneScript error');
						err.data = errData;
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
						const errData = err;
						err = new Error('PackageUtil.sendToPackage error');
						err.data = errData;
					}
					reject(err);
				}
				resolve(result);
			}, this.timeout);
		});
	}
}
module.exports = PackageUtil;
