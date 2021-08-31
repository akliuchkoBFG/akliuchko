// Shim for CCSGComponent.js that fixes a noisy error message like the following
// "Should not add cc.Sprite to a node which size is already used by its other component."
// There appears to be some double initialization logic in-editor for registering a size provider
//  that causes this message to appear when a sprite component is conflicting with itself
// This is easily observed when opening an animation timeline that activates a sprite node on the first frame
// To silence this superfluous dev-only error, override the prototype and ignore the error if appropriate
// There's probably something more broken higher up the chain, but since there appear to be no ill side effects
//  other than the error, this is a small change that does not require deep engine knowledge

cc._SGComponent.prototype._registSizeProvider = function () {
    if ( !this.node._sizeProvider ) {
        this.node._sizeProvider = this._sgNode;
    }
    else if (CC_DEV) {
        var name = cc.js.getClassName(this);
        if (this.node.getComponent(cc.Canvas)) {
            cc.errorID(3627, name);
        }
        // SAG Modification: see if the SGComponent is conflicting with itself before erroring
        else if (this.node._sizeProvider !== this._sgNode) {
            cc.errorID(3628, name);
        }
    }
};