const SagaZoneGroup = cc.Class({
	name:'SagaZoneGroup',
	properties:{
		stepIDs: {
			default: [],
			type: [cc.Integer],
			visible: false,
			serializable: false,
			tooltip: 'Step IDs for steps that use this zone, assigned at runtime. Ordered by page index',
		},

		zoneName: {
			default: '',
			tooltip: 'Name of the zone, used for selecting zone assets outside the step prefabs',
		},

		stepPrefab: {
			default: null,
			type: cc.Prefab,
			tooltip: 'Prefab for the base step node, used for all steps except the final zone reward. Prefab names must be unique between zones',
		},

		zoneRewardPrefab: {
			default: null,
			type: cc.Prefab,
			tooltip: 'Prefab for the zone reward step node, used for the final reward at the end of the zone. Prefab names must be unique between zones',
		},
	},

	cloneFromZoneGroup(zoneGroup) {
		this.zoneName = zoneGroup.zoneName;
		this.stepPrefab = zoneGroup.stepPrefab;
		this.zoneRewardPrefab = zoneGroup.zoneRewardPrefab;
	},

	getPageIndex(stepID) {
		stepID = "" + stepID;
		return this.stepIDs.indexOf(stepID);
	},

	isFirstStep(stepID) {
		stepID = "" + stepID;
		// Check against the last index since steps are reversed in the list
		const lastIndex = this.stepIDs.length - 1;
		return this.stepIDs[lastIndex] === stepID;
	},
});

module.exports = SagaZoneGroup;
