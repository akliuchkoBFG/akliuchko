let loadData = {};

const VERBOSE = true;

const PreviewLoadData = Object.freeze({
	_log(msg) {
		if (VERBOSE) {
			Editor.log(msg);
		}
	},

	listenForMessages(listener) {
		try {
			listener.on('sakit-preview-server:add-load-data', (evt, inputLoadData) => {
				this.addLoadData(inputLoadData);
				if (evt.reply) {
					evt.reply(null, loadData);
				}
			});
			listener.on('sakit-preview-server:add-load-data-prop', (evt, prop, value) => {
				this.setLoadDataProperty(prop, value);
				if (evt.reply) {
					evt.reply(null, loadData);
				}
			});
		} catch (e) {
			Editor.error(e);
		}
	},

	addLoadData(inputLoadData) {
		Object.keys(inputLoadData)
		.forEach((prop) => {
			this.setLoadDataProperty(prop, inputLoadData[prop]);
		});
		return loadData;
	},

	setLoadDataProperty(prop, value) {
		if (loadData[prop] != null) {
			this._log("Overwriting preview load data\nKey: " + prop + "\nValue: " + JSON.stringify(value));
		}
		loadData[prop] = value;
	},

	get() {
		return loadData;
	},

	clear() {
		loadData = {};
	},
});

module.exports = PreviewLoadData;