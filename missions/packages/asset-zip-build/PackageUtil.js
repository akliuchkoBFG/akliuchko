class PackageUtil {
	constructor(packageName) {
		this.packageName = packageName;
	}
	callSceneScript(message, ...args) {
		return new Promise((resolve, reject) => {
			const timeout = 120e3;
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
			}, timeout);
		});
	}
	sendToPackage(message, ...args) {
		return new Promise((resolve, reject) => {
			const timeout = 120e3;
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
			}, timeout);
		});
	}
}
module.exports = PackageUtil;
