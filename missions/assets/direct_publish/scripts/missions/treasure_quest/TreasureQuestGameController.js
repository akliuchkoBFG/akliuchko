const BaseMissionStepComponent = require('BaseMissionStepComponent');
const BoardGamePlayer = require('BoardGamePlayer');
const TreasureQuestScrollController = require('TreasureQuestScrollController');
const TAG = "TreasureQuestGameController";
const ComponentLog = require('ComponentSALog')(TAG);
const MissionRewardSequence = require('MissionRewardSequence');
const TreasureQuestRewardController = require('TreasureQuestRewardController');
const AnimationClipProperty = require('AnimationClipProperty');

const ANIM_COMPONENT_PROPERTY = 'animation';
const ANIM_CLIP_NAMES = [
	'stepComplete',
	'stepClaim',
	'stepOutro',
	'missionComplete',
];

cc.Class({
	extends: BaseMissionStepComponent,

	editor: CC_EDITOR && {
		menu: 'Missions/TreasureQuest/GameController',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},
	mixins: [ComponentLog],

	properties: {
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Animation component for mission and step animation choreography',
				'Adding this component will reveal states for stepComplete, stepClaim, stepOutro, and missionComplete',
			].join('\n')
		),
		stepComplete: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for when a step is complete'
		),
		stepClaim: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for playing alongside the start of claim flow, ideal for hiding claim buttons and other UI'
		),
		stepOutro: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'(optional) Animation state that plays after claim sequence is complete to transition to the next step'
		),
		missionComplete: AnimationClipProperty.propertyDefinition(
			ANIM_COMPONENT_PROPERTY,
			'Animation state for when all steps are complete and have been claimed'
		),

		tileHelper: {
			default: null,
			type: cc.Node,
			tooltip: 'Helper for setting the array of tiles using a parent container, orders tiles by numeric value in the corresponding node name',
			editorOnly: true,
			notify() {
				if (!this.tileHelper || !CC_EDITOR) {
					return;
				}
				
				const tilesContainer = this.tileHelper.getChildByName('tiles');

				const tiles = tilesContainer.getComponentsInChildren(cc.Sprite);
				if (tiles.length === 0) {
					Editor.warn("BoardGameTile components not found in Tile Helper node " + this.tileHelper.name);
					this.tileHelper = null;
					return;
				} 
				const sortedTiles = _.sortBy(tiles, (tile) => {
					const nodeName = tile.name;
					// Strip out all non-numeric characters for sorting
					return +nodeName.replace(/[^\d]+/g, '');
				});
				this.tiles = sortedTiles;
				this.tileHelper = null;
			},
		},
		tiles: {
			default: [],
			type: [cc.Sprite],
			tooltip: 'Array of tiles, in the sequential order they should be traversed',
		},
		player: {
			default: null,
			type: BoardGamePlayer,
			tooltip: 'Player pawn component that can move around the board',
		},
		scrollMap: {
			default: null,
			type: TreasureQuestScrollController,
			tooltip: 'Scroll component to control map movement',
		},
		rewardsController: {
			default: null,
			type: TreasureQuestRewardController,
		},
		claimSequence: {
			default: null,
			type: MissionRewardSequence,
			tooltip: "Claim sequence controller for supporting multiple rewards and rich claim choreography\nIf present, ignores 'Claim State' property",
		},
	},

	onLoad: function() {
		// Claiming a step will finish the reward sequence
		this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
		this._claimInProgress = false;
	},

	start: function() {
		this._tileGroupedByStepID = this.groupTilesByStepId();
		const missionInterface = this.missionStepInterface.missionInterface;

		
		const stepID = parseInt(this.missionStepInterface.stepID);
		const finalStepID = parseInt(missionInterface.getFinalStepID());
		const missionStepState = this.missionStepInterface.getState(); // states: locked | active | complete | redeemed
		let currentTile = null;

		if (stepID === finalStepID && missionStepState === 'redeemed') {
			// Mission complete, place on final tile and setup finished mission state
			const endTileGroup = this._tileGroupedByStepID.get((stepID).toString());
			currentTile = endTileGroup[endTileGroup.length - 1];
			this.missionComplete.play();
		} else {
			// Show claim interface
			if (missionStepState === 'complete') {
				this.stepComplete.play();
			}
			// Get current tile
			if (stepID > 0) {
				// At least one step is complete
				const prevTileGroup = this._tileGroupedByStepID.get((stepID - 1).toString());
				currentTile = prevTileGroup[prevTileGroup.length - 1];
			} else {
				currentTile = this.tiles[0];
			}
		}

		if (this.player) {
			this.player.setupOnTile(currentTile);
		}
		if (this.scrollMap) {
			this.scrollMap.setupToChildNode(this.player.node.name);
		}
		// this.claimAward();
	},

	claimAward() {
		if (this._claimInProgress) {
			this.log.d("Attempted to claim step award multiple times");
			return;
		}
		this._claimInProgress = true;
		this.scrollMap.disableScroll();
		this.missionStepInterface.claimAward();	
		// Kick off animation to hide UI
		this.stepClaim.play();
	},

	onClaim: function(evt) {
		const claimedStepID = parseInt(evt.detail.stepID);
		let reenableScrollAfterClaim = true;

		// Claim sequence
		Promise.resolve()
		.then(() => {
			if (this.scrollMap) {
				return this.scrollMap.scrollToChildNode(this.player.node.name);
			}
		})
		.then(() => {
			// Move player piece
			if (this.player) {
				this.scrollMap.disableScroll();
				const targetTileGroup = this._tileGroupedByStepID.get(claimedStepID.toString());
				const targetTile = targetTileGroup[targetTileGroup.length - 1];
				const targetTileIndex = this.tiles.indexOf(targetTile);

				const previousGroup = this._tileGroupedByStepID.get((claimedStepID - 1).toString());

				let previousTileIndex = 0;
				if (previousGroup) {
					const previousTile = previousGroup[previousGroup.length - 1];
					previousTileIndex = this.tiles.indexOf(previousTile);
				}
				const intermediateTiles = this.tiles.slice(previousTileIndex + 1, targetTileIndex);
				return this.player.move(targetTile, intermediateTiles);
			}
		})
		.then(() => {
			if (this.rewardsController) {
				return this.rewardsController.claimReward();
			}
		})
		.then(() => {
			if (this.claimSequence) {
				return this.claimSequence.playSequence();
			}
		})
		.then(() => {
			this.missionStepInterface.onStepComplete();
		})
		.then(() => {
			const stepID = this.missionStepInterface.stepID;
			const finalStepID = this.missionStepInterface.missionInterface.getFinalStepID();

			const missionStepState = this.missionStepInterface.getState();
			if (stepID === finalStepID && missionStepState === 'redeemed') {
				// Play mission complete animation upon finishing the last step
				reenableScrollAfterClaim = false;
				return this.missionComplete.play();
			} else {
				// Show UI that was hidden during claim sequence
				return this.stepOutro.play();
			}
		})
		.finally(() => {
			if (reenableScrollAfterClaim) {
				this.scrollMap.enableScroll();
			}
			this._claimInProgress = false;
		});
	},

	groupTilesByStepId: function() {
		const stepIDs = this.missionStepInterface.missionInterface.getAllStepIDs();
		const tileGroupedByStepID = new Map();
		let groupStartingIndex = 0;

		stepIDs.forEach((id) => {
			const arr = [];
			tileGroupedByStepID.set(id, arr);

			for(let i = groupStartingIndex; i < this.tiles.length; ++i) {
				const tile = this.tiles[i];
				arr.push(tile);
			
				if (tile.node.name.indexOf("_win") > -1) {
					groupStartingIndex = ++i;
					break;
				}
			}
		});

		return tileGroupedByStepID;
	}
});
