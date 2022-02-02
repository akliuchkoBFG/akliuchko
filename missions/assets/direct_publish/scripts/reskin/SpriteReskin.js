/* global
	_Scene
*/
const ReskinElement = require('ReskinElement');
cc.Class({
	extends: ReskinElement,

	editor: CC_EDITOR && {
		executeInEditMode: true,
		requireComponent: cc.Sprite,
		menu: 'Tools/Reskin/Sprite',
	},

	properties: {
		spriteFrame: {
			default: null,
			serializable: false,
			notify(/* prev */) {
				this.updateSprite();
			},
			type:cc.SpriteFrame,
		}
	},

	updateSprite() {
		if (!this.spriteFrame) {
			return;
		}
		const sprite = this.getComponent(cc.Sprite);
		const prevSpriteFrame = sprite.spriteFrame;
		this._validateSprite(prevSpriteFrame, this.spriteFrame);
		sprite.spriteFrame = this.spriteFrame;
		this.markReskinned();
	},

	_validateSprite(prevSprite, newSprite) {
		const pRect = prevSprite.getRect();
		const nRect = newSprite.getRect();
		if (pRect.width !== nRect.width || pRect.height !== nRect.height) {
			Editor.warn([
				'Reskin Warning: Size mismatch on sprite frame for ' + this.node.name + ' (expand for details)',
				'Previous size: ' + JSON.stringify(pRect),
				'New size: ' + JSON.stringify(nRect),
				'Full node path: ' + _Scene.NodeUtils.getNodePath(this.node),
			].join('\n'));
		}
	},
});
