const StoreMissionDialogViewController = require('StoreMissionDialogViewController');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
const MissionInterface = require('MissionInterface');
const AnimationPromise = require('AnimationPromise');

const TAG = 'StoreInsufficientFundsViewController';
const ComponentLog = require('ComponentSALog')(TAG);


cc.Class({
    extends: StoreMissionDialogViewController,

    mixins: [ComponentLog, cc.EventTarget],

    editor: CC_EDITOR && {
        inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
        menu: 'Missions/Types/Shopping Spree/Store Insufficient Funds View Controller',
    },

    properties: {
        displayTime: {
            default: 1.0,
            tooltip:"How long this popup will be displayed for before hiding iteself. Time is in seconds"
        },
    },

    /*
     * Update data and set values before playing the anim clip to show the dialog
     */
    showDisplayForIndex: function(event){
        this.setIndex(+event.detail.index);
        if(this._hidePromise){
            this.node.setPosition(0,0);
            this._hidePromise.cancel();
        }
        this.repositionBasedOnNode(event.detail.node,event.detail.offset);
        this.showDisplay();
        this.autoHide();
    },

    //Hide automatically after some number of seconds
    autoHide: function(){
        this._hidePromise = Promise.delay(this.displayTime * 1000).bind(this).then(function(){
            return this.hideDisplay(null);
        })
        .then(function(){
            this.node.setPosition(0,0);
        })
        .catch(AnimationPromise.Stopped, function(err){
        });
    },

    // World to local space transformation to correctly reposition our node relative to the target with offset
    repositionBasedOnNode: function(node, offset){
        //Convert reference node to world space
        let purchasableItemPosition = node.parent.convertToWorldSpaceAR(node.position);
        //Add offset
        purchasableItemPosition.x += offset.x;
        purchasableItemPosition.y += offset.y;
        //convert to this nodes position
        let newPositionForDialog = this.node.convertToNodeSpaceAR(purchasableItemPosition);
        this.node.setPosition(newPositionForDialog.x,newPositionForDialog.y);
    }

});
