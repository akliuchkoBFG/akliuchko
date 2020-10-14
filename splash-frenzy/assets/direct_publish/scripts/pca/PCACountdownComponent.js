const PCABaseComponent = require('PCABaseComponent');
const CountdownComponent = require('CountdownComponent');

cc.Class({
    extends: PCABaseComponent,
    editor: CC_EDITOR && {
        menu: 'Add PCA Component/Simple Countdown',
        requireComponent: CountdownComponent,
    },

    // use this for initialization
    onLoad: function () {
        this._countdownView = this.getComponent('CountdownComponent');
        if (this._loadData.secondsRemaining) {
            this._endTime = Date.now() + this._loadData.secondsRemaining * 1000;
        }
    },
    start: function() {
        this._countdownView.setEndTime(this._endTime);
    }
});