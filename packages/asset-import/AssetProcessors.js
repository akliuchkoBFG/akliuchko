const replacestream = require('./lib/replacestream.js');

const Processors = {};

class AssetProcessor {
	constructor(assetDefinition) {
		this.assetDefinition = assetDefinition;
	}

	static getAssetProcessor(assetDefinition) {
		const Processor = Processors[assetDefinition.assetType] || this;
		return new Processor(assetDefinition);
	}
	// Interface for mutating the download file stream before writing it to a file
	processDownload(stream) {
		return stream;
	}

	// Interface for performing actions after the download but before the assetdb refresh
	postProcessAsset(filePath, cb) {
		cb();
	}
}

class AssetProcessorAtlas extends AssetProcessor {
	processDownload(stream) {
		const streamTransform = replacestream(
			this.assetDefinition.directoryPrefix,
			''
		);
		return stream.pipe(streamTransform);
	}
}
Processors.atlas = AssetProcessorAtlas;

module.exports = AssetProcessor;
