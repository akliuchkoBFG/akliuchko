const AudioType = cc.Enum({
	Effects: 1,
	Music: 2,
});

cc.Class({
	extends: cc.AudioSource,

	editor: CC_EDITOR && {
		menu: 'i18n:MAIN_MENU.component.others/AudioSource',
		help: 'i18n:COMPONENT.help_url.audiosource',
	},

	properties: {
		audioType: {
			default: AudioType.Effects,
			type: AudioType,
		},

		_sourceVolume: 1,
		_volume: {
			override: true,
			get() {
				if (CC_EDITOR) {
					return this._sourceVolume;
				}
				let masterVolume = 1;
				try {
					const volumeStrategy = `get${AudioType[this.audioType]}Volume`;
					// Call into the global cc Audio Engine used by SAKit to get the appropriate master volume setting
					masterVolume = global.cc.AudioEngine.getInstance()[volumeStrategy]();
				} catch(e) { /* Intentionally empty */ }
				
				return this._sourceVolume * masterVolume;
			},
			set(volume) {
				this._sourceVolume = volume;
			},
		},
	},
});
