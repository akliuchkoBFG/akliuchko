/* global
	_Scene
*/
const ReskinElement = require('ReskinElement');
cc.Class({
	extends: ReskinElement,

	editor: CC_EDITOR && {
		executeInEditMode: true,
		requireComponent: sp.Skeleton,
		menu: 'Tools/Reskin/Spine',
	},

	properties: {
		skeletonData: {
			default: null,
			serializable: false,
			notify(/* prev */) {
				this.updateSpine();
			},
			type:sp.SkeletonData,
		},
	},

	updateSpine() {
		if (!this.skeletonData) {
			return;
		}
		const spine = this.getComponent(sp.Skeleton);
		const currentAnimation = spine.defaultAnimation;
		const prev = spine.skeletonData;
		this._validateSpine(prev, this.skeletonData);
		spine.skeletonData = this.skeletonData;
		spine.defaultAnimation = currentAnimation;
		// Load bearing getter/setter reset, the following gets the index from spine.defaultAnimation
		//  then forces the current animation to reflect that state name if it exists
		spine._animationIndex = spine._animationIndex;
		this.markReskinned();
	},

	_validateSpine(prevSkeleton, newSkeleton) {
		const prevStates = this._getAnimationStates(prevSkeleton);
		const newStates = this._getAnimationStates(newSkeleton);
		const missingStates = prevStates.filter((stateName) => {
			return newStates.indexOf(stateName) < 0;
		});
		const addedStates = newStates.filter((stateName) => {
			return prevStates.indexOf(stateName) < 0;
		});
		if (missingStates.length > 0 || addedStates.length > 0) {
			Editor.warn([
				'Reskin Warning: mismatch on spine skeleton for ' + this.node.name + ' (expand for details)',
				'Missing states based on template animation: ' + missingStates.join(', '),
				'Added states that are not in the template: ' + addedStates.join(', '),
				'Full node path: ' + _Scene.NodeUtils.getNodePath(this.node),
			].join('\n'));
		}
	},

	_getAnimationStates(skeletonData) {
		return cc.Enum.getList(skeletonData.getAnimsEnum())
		.map((item) => {
			return item.name;
		});
	},
});
