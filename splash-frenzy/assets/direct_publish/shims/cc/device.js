/* eslint no-unused-vars: false*/
// Shim for cc.Device on browser based platforms
(function() {
	cc.Device = cc.Device || {
		setAccelerometerEnabled: function (bool) {},
		setAccelerometerInterval: function (float) {},
		setKeepScreenOn : function (bool) {},
		vibrate: function (float) {},
		getDPI: function () {return 0;},
	};
}());
