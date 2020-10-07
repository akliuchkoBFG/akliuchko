
module.exports = {
	setComponentPath: function (cls, path) {
		path = path.charAt(path.length - 1) !== '/' ? path + '/' : path;

		for (let i = 0, len = cc._componentMenuItems.length; i < len; ++i) {
			if (cc._componentMenuItems[i].component === cls) {
				const menuPath = cc._componentMenuItems[i].menuPath;
				const lastSlash = menuPath.lastIndexOf('/');
				if (lastSlash !== -1) {
					cc._componentMenuItems[i].menuPath = menuPath.substring(0, lastSlash + 1) + path + cc.js.getClassName(cls);
				} else {
					cc.error("Could not find final slash in menu path for class: " + cc.js.getClassName(cls));
				}
				return;
			}
		}
		cc.error("Could not find component class: " + cc.js.getClassName(cls));
	},
};