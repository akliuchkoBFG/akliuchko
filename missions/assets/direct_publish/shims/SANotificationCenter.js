// 
// Editor Shim for SAKit notification center
// 

const notificationInterface = Object.freeze({
	addMultipleObservers() {},
	addObserver() {},
	removeObserver() {},
	postNotification() {},
});

global.SANotificationCenter = Object.freeze({
	getInstance() {
		return notificationInterface;
	},
});
