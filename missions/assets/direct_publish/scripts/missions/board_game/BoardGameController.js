const BaseMissionStepComponent = require('BaseMissionStepComponent');

const TAG = "BoardGameController";
const ComponentLog = require('ComponentSALog')(TAG);

const BoardGameTile = require('BoardGameTile');
const BoardGameTileGroup = require('BoardGameTileGroup');
const BoardGameRandomizer = require('BoardGameRandomizer');
const BoardGamePlayer = require('BoardGamePlayer');
const MissionStepRewardSequence = require('MissionStepRewardSequence');
const AnimationClipProperty = require('AnimationClipProperty');

const seedrandom = require('seedrandom');

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
		menu: 'Missions/Types/Board Game/Controller',
		inspector: Editor.SAG.ComponentInspector('custom-property-inspector'),
	},

	mixins: [ComponentLog],

	properties: {
		// Animation component for anim states. Property name must match ANIM_COMPONENT_PROPERTY
		animation: AnimationClipProperty.ccAnimationForProperties(
			ANIM_COMPONENT_PROPERTY,
			ANIM_CLIP_NAMES,
			[
				'Animation component for mission and step animation choreography',
				'Adding this component will reveal states for stepComplete, stepClaim, stepOutro, and missionComplete',
			].join('\n')
		),

		// Animation states
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

		claimSequence: {
			default: null,
			type: MissionStepRewardSequence,
			tooltip: "Claim sequence controller for supporting multiple rewards and rich claim choreography\nIf present, ignores 'Claim State' property",
		},

		progressRandomizer: {
			default: null,
			type: BoardGameRandomizer,
			tooltip: 'Movement/board progress randomizer, responsible for showing the sequence for spinning/rolling a result',
		},

		player: {
			default: null,
			type: BoardGamePlayer,
			tooltip: 'Player pawn and movement component for handling how the player moves around the board',
		},

		tileHelper: {
			default: null,
			type: cc.Node,
			tooltip: 'Helper for setting the array of tiles using a parent container, orders tiles by numeric value in the corresponding node name',
			editorOnly: true,
			notify() {
				if (!this.tileHelper || !CC_EDITOR) {
					return;
				}
				const tiles = this.tileHelper.getComponentsInChildren(BoardGameTile);
				if (tiles.length === 0) {
					Editor.warn("BoardGameTile components not found in Tile Helper node " + this.tileHelper.name);
					this.tileHelper = null;
					return;
				} 
				const sortedTiles = _.sortBy(tiles, (tile) => {
					const nodeName = tile.node.name;
					// Strip out all non-numeric characters for sorting
					return +nodeName.replace(/[^\d]+/g, '');
				});
				this.tiles = sortedTiles;
				// Clear out the editor reference to make it obvious this node is not used
				this.tileHelper = null;
			},
		},
		tilePrefabReplacement: {
			default: null,
			type:cc.Prefab,
			tooltip: [
				'Helper for resetting tiles to a specific tile prefab',
				'Retains tile node names and positions',
			].join('\n'),
			notify() {
				if (!this.tilePrefabReplacement || !CC_EDITOR) {
					return;
				}
				if (!this.tilePrefabReplacement.data.getComponent(BoardGameTile)) {
					Editor.error('Unable to set new prefab, not a board game tile');
					this.tilePrefabReplacement = null;
					return;
				}
				const tiles = this.tiles;

				tiles.forEach((tile, index) => {
					const node = tile.node;
					const position = node.position;
					const name = node.name;
					const newNode = cc.instantiate(this.tilePrefabReplacement);
					newNode.position = position;
					newNode.name = name;
					// Add node to hierarchy at current node's position
					node.getParent().addChild(newNode, node.parent.children.indexOf(node));
					node.removeFromParent();
					const tileComp = newNode.getComponent(BoardGameTile);
					this.tiles[index] = tileComp;

					// Update start and end tile references if necessary
					if (tile === this.startTile) {
						this.startTile = tileComp;
					}
					if (tile === this.endTile) {
						this.endTile = tileComp;
					}
				});
				this.tilePrefabReplacement = null;
			}
		},
		startTile: {
			default: null,
			type: BoardGameTile,
			tooltip: 'Single tile representing the space where the pawn starts',
		},
		endTile: {
			default: null,
			type: BoardGameTile,
			tooltip: 'Single tile representing the space where the pawn ends when the mission is complete and claimed',
		},
		tiles: {
			default: [],
			type: [BoardGameTile],
			tooltip: 'Array of tiles, in the sequential order they should be traversed',
		},
	},

	onLoad: function() {
		// Claiming a step will finish the reward sequence
		this.missionStepInterface.missionInterface.on('claimedStepAward', this.onClaim, this);
	},

	start: function() {
		this._randomNumbersByStepID = {};
		// Create tile groups from step data
		const missionInterface = this.missionStepInterface.missionInterface;
		const stepIDs = missionInterface.getAllStepIDs();
		this._randomizeTileOrderForSteps(missionInterface, stepIDs);
		let availableTiles = _.clone(this.tiles);
		const tileGroups = stepIDs.map((stepID) => {
			const stepData = missionInterface.getStepData(stepID);
			const tileGroup = new BoardGameTileGroup();
			tileGroup.setStepData(stepData);
			tileGroup.setShuffleOrder(this._randomNumbersByStepID[stepID]);
			availableTiles = tileGroup.claimTiles(availableTiles);
			return [stepID, tileGroup];
		});
		this._tileGroupsByStepID = _.zipObject(tileGroups);

		const stepID = this.missionStepInterface.stepID;
		const finalStepID = missionInterface.getFinalStepID();

		// Position the player based on the mission state
		let currentTile;
		const missionStepState = this.missionStepInterface.getState();
		if (stepID === finalStepID && missionStepState === 'redeemed') {
			// Mission complete, place on final tile and setup finished mission state
			currentTile = this.endTile;
			this.missionComplete.play();
		} else {
			// Show claim interface
			if (missionStepState === 'complete') {
				this.stepComplete.play();
			}
			// Get current tile
			if (stepID > 0) {
				// At least one step is complete
				const prevTileGroup = this._tileGroupsByStepID[stepID - 1];
				currentTile = prevTileGroup;
				// Currently occupied space determined from previous step's award
				currentTile = prevTileGroup.getAwardTile();
			} else {
				// First step not completed, player piece should not move
				currentTile = this.startTile;
			}
		}
		if (this.player) {
			this.player.setupOnTile(currentTile);
		}
	},

	// Creates a list of consistent PRNG values to use for randomizing the tile order
	// Tile order randomization is performed when adding tiles to a BoardGameTileGroup
	_randomizeTileOrderForSteps(missionInterface, stepIDs) {
		const rng = seedrandom('missionID.' + missionInterface.getMissionID());
		const stepRandomNumberEntries = stepIDs.map((stepID) => {
			const stepData = missionInterface.getStepData(stepID);
			const lootboxItem = this._getLootboxItemFromStepData(stepData);
			let rngValues = [];
			if (lootboxItem) {
				const productPackages = lootboxItem.lootbox;
				rngValues = productPackages.map(() => {
					return rng();
				});
			}
			return [stepID, rngValues];
		});
		this._randomNumbersByStepID = _.zipObject(stepRandomNumberEntries);
	},

	_getLootboxItemFromStepData(stepData) {
		const award = stepData.data.award;
		if (award && award.ProductPackageItemLootBox) {
			// Award contains a loot box, use individual loot box product packages as tiles
			const lootboxes = _.sortBy(award.ProductPackageItemLootBox, 'order');
			if (lootboxes.length > 1) {
				this.log.e("More than one lootbox is undefined behavior, using first one");
			}
			return lootboxes[0];
		}
	},

	// this reads the loot box data from the award result
	_parseLootboxData: function(awardResult) {
		const lootboxData = {
			items: [],
			index: -1,
		};

		if (awardResult && awardResult.length > 0) {
			awardResult.forEach((awardItem) => {
				if (awardItem.class === 'ProductPackageItemLootBox') {

					// parse result...
					const lootboxResult = awardItem.result;
					// items are the items the product package they were awarded from the loot box
					lootboxData.items = lootboxResult.items;
					// product package index is the index of the package they got in the list of lootbox packages
					lootboxData.index = lootboxResult.productPackageIndex;

				} else {
					this.log.d("Award result " + awardItem.class + " is not supported in this demo");
				}
			});
		} else {
			this.log.w("No award result found");
		}

		return lootboxData;
	},

	claimAward() {
		if (this._claimInProgress) {
			this.log.d("Attempted to claim step award multiple times");
			return;
		}
		this._claimInProgress = true;
		this.missionStepInterface.claimAward();
		if (this.progressRandomizer) {
			this.progressRandomizer.startSequence();
		}
		// Kick off animation to hide UI
		this.stepClaim.play();
	},

	// this is triggered by claiming a step reward
	onClaim(evt) {
		const claimedStepID = evt.detail.stepID;
		const stepData = this.missionStepInterface.missionInterface.getStepData(claimedStepID);
		// Update tile group with award result info
		this._tileGroupsByStepID[claimedStepID].setStepData(stepData);
		const targetTile = this._tileGroupsByStepID[claimedStepID].getAwardTile();
		const targetTileIndex = this.tiles.indexOf(targetTile);
		const previousGroup = this._tileGroupsByStepID[claimedStepID - 1];
		let previousTileIndex = -1; // -1 represents the value of the start tile
		if (previousGroup) {
			const previousTile = previousGroup.getAwardTile();
			previousTileIndex = this.tiles.indexOf(previousTile);
		}
		const intermediateTiles = this.tiles.slice(previousTileIndex + 1, targetTileIndex);

		// Claim sequence
		Promise.resolve()
		.then(() => {
			// Resolve randomizer
			if (this.progressRandomizer) {
				return this.progressRandomizer.finishSequence(targetTile, targetTileIndex - previousTileIndex);
			}
		})
		.then(() => {
			// Move player piece
			if (this.player) {
				return this.player.move(targetTile, intermediateTiles);
			}
		})
		.then(() => {
			// Show reward claim sequence
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
				return this.missionComplete.play();
			} else {
				// Show UI that was hidden during claim sequence
				return this.stepOutro.play();
			}
		})
		.finally(() => {
			this._claimInProgress = false;
		});
	},
});
