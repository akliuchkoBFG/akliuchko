const TAG = "SpriteFrameSelector";
const ComponentLog = require('ComponentSALog')(TAG);

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        requireComponent: cc.Sprite,
        menu: 'Miscellaneous/Sprite Frame Selector',
    },
    
    properties: {
        spriteFrames:{
            default: [],
            type: [cc.SpriteFrame],
        },

        selection: {
			default: 0,
			min: 0,
			step: 1,
			notify: function() {
				this.selectFrame(this.selection);
			}
		},
    },

    selectFrame(index) {
        if (index >= 0 && index < this.spriteFrames.length) {
            if (this.selection !== index) {
                this.selection = index;
                return
            }
            
            const sprite = this.getComponent("cc.Sprite");
            sprite.spriteFrame = this.spriteFrames[index];
        }
    }
});
