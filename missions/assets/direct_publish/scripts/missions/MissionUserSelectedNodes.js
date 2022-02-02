
const TAG = "MissionUserSelection";
const ComponentLog = require('ComponentSALog')(TAG);
const BaseMissionComponent = require('BaseMissionComponent');

cc.Class({
	extends: BaseMissionComponent,

	mixins: [ComponentLog],

	editor: CC_EDITOR && {
		menu: 'Missions/Types/User Selection/User Selected Nodes',
	},

	properties: {

		revealAnim: {
			default: null,
			type: cc.AnimationClip,
			tooltip: "Adds this animation to each child, and plays said animation on selection",
		},

		swapDelay: {
			default: 0,
			type: cc.Float,
			tooltip: "Adds a delay to switching items to allow timing not accounted for in the animation before showing the new selection."
		},

		dataKey: {
			default: "default_key",
			tooltip: "Data is stored as key:value pair, this is the KEY for this selection",
		},

		selectionValues: {
			default: [],
			type: [cc.String],
			tooltip: "The selection values map to toggle the child node at this index (ex: 'option1', 'option2')"
		},
	},

	// use this for initialization
	onLoad: function () {
		this._super();

		this.missionInterface.on('publicCommandDataUpdated', (event) => {
			this.onPublicCommandDataUpdated();
		});

		// toggle off nodes at until we have data to turn them back on
		if (!CC_EDITOR) {
			for (let i= 0; i < this.node.children.length; ++i) {
				const child = this.node.children[i];
				this._setRevealAnim(child);
				child.active = false;
			}
		}
	},

	_setRevealAnim: function(child) {
		if (!this.revealAnim) {
			return;
		}
		if (!child.getComponent('cc.Animation')) {
			child.addComponent('cc.Animation');
		}
		child.getComponent('cc.Animation').addClip(this.revealAnim);
	},

	onUpdateMissionData: function() {
		// mission data has been updated, refresh the state
		this._toggleNodes();
	},

	onPublicCommandDataUpdated: function() {
		// command data has been updated "locally", refresh the state
		this.scheduleOnce(this._toggleNodes, this.swapDelay);
	},

	_toggleNodes: function() {
		const publicState = this.missionInterface.getPublicCommandData();
		if (!publicState.hasOwnProperty(this.dataKey)) {
			return;
		}
		
		const selection = publicState[this.dataKey];
		let childToggled = false;
		for (let i= 0; i < this.node.children.length; ++i) {
			let child = this.node.children[i];
			if (selection === this.selectionValues[i]) {
				// Schedule the animation to play after the swap delay. This will also add a 1 frame delay for the schedule to execute.
				this._playReveal(child);
				child.active = true; 
				childToggled = true;
			}	else {
				child.active = false;
			}
		}
		
		if (!childToggled) {
			this.log.w(`No selection value matching '${selection}' found.`);
		}
	},

	_playReveal: function(child) {
		if (!this.revealAnim || child.active) {
			return;
		}

		const animNode = child.getComponent('cc.Animation');
		if (!animNode) {
			this.log.e(`revealAnim set on ${this.dataKey} but no animation component was found`);
			return;
		}
		animNode.play(this.revealAnim.name);
	}

	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});
