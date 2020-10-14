// So this hack is to potentially fix issues with widgets being left disabled after editing the animation
//  timeline. This keeps the widget enabled when entering edit mode, therefore it can't end up disabled.
//  The widgets are disabled because they get called from a fresh update loop from the director, so alignment
//  is performed. The widget is then disabled. By preventing isAlignOnce from being true, the enabled flag
//  stays on.
//
// My working theory as to why this happens is they are using the undo stack to revert all the node changes
//  performed inside the animation tool. If something conflicts or causes the undo to fail, the animation
//  state may never roll back. We haven't seen anything other than the widgets getting left disabled, but my
//  suspicions are that the undo's are failing for whatever reason, leaving the widget disabled.
if (CC_EDITOR && !cc.Widget._HACKINSTALLED) {
    cc.Widget._HACKINSTALLED = true;
    Object.defineProperty(cc.Widget.prototype, "isAlignOnce", {
        get: function () {
            if (window._Scene && _Scene.AnimUtils && _Scene.AnimUtils.curAnimState) {
                return false;
            }
            return this.___alignOnce;
        },
        set: function set(val) {
            this.___alignOnce = val;
        },
    });
}