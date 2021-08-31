module.exports = cc.Class({
    name: 'SceneDataMapping',
    properties: {
        dataKey: {
            default: '',
            tooltip: 'The key used for replacing text in labels',
        },
        dataText: {
            default: '',
            tooltip: 'Text that will be shown when using the specified key within a label',
            multiline: true,
        },

    },

    getKey() {
        return this.dataKey;
    },

    getText() {
        return this.dataText;
    },

    setValue(value) {
        this.dataText = value;
    },

});
