(() => {

const slotData = {
	// This property key must exist to get watcher updates when slot data refreshes
	// Consequently data refreshes must always update the data for this key to trigger a redraw
	152: {
		buyInID: 152,
		name: "Jackpot City",
		theme2_1: "jpcnew",
		minTotalBet: 125,
		initial: true,
	},
};

function updateBuyInData(silent) {
	Editor.SAG.PigbeeRequest.get({
		env: 'qa',
		app: 'bfc',
		controller: 'cocos_creator',
		action: 'getBuyInOptions',
	})
	.then((response) => {
		try {
			const buyIns = JSON.parse(response);
			Object.assign(slotData, buyIns);
			if (!silent) {
				Editor.success("Finished reloading slots list options");
			}
		} catch(err) {
			Editor.error("Can't update slots list, unexpected data response\n" + err);
		}
	})
	.catch((err) => {
		Editor.error("Can't connect with the qa environment to update slots list\n" + err);
	});
}
// Make a silent initial request for buy in data
updateBuyInData('silent');

return Vue.component('launch-slots-inspector', {
	dependencies: [],

	template: `
		<ui-prop name="Slot Machine" tooltip="Slot machine to launch">
			<ui-select class="flex-1" @change="onBuyInSelect" :value="target.buyInID.value" v-if="!slotData[152].initial">
				<option v-for="slotProperties in slotData" :value="slotProperties.buyInID">{{slotProperties.buyInID}} – {{slotProperties.name}} ({{slotProperties.minTotalBet}})</option>
			</ui-select>
			<ui-button class="transparent" tooltip="Toggle advanced input" @confirm="toggleAdvancedInput" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-eye"></i></ui-button>
			<ui-button class="blue transparent" tooltip="Refresh list from Pigbee" @confirm="refreshBuyInOptions" @mouseenter="showTooltip" @mouseleave="hideTooltip"><i class="icon-cw"></i></ui-button>
		</ui-prop>
		<ui-prop v-prop="target.buyInID" v-show="showAdvanced" v-value="target.buyInID.value"></ui-prop>
		<ui-prop v-prop="target.theme2_1" v-show="showAdvanced" v-value="target.theme2_1.value"></ui-prop>
		<ui-prop v-prop="target.layoutViewSet" v-show="showAdvanced" v-value="target.layoutViewSet.value"></ui-prop>
		<ui-prop v-prop="target.layoutViewName" v-show="showAdvanced" v-value="target.layoutViewName.value"></ui-prop>
		<ui-prop v-prop="target.introViewSet" v-show="showAdvanced" v-value="target.introViewSet.value"></ui-prop>
	`,

	data: function() {
		return {
			slotData,
			showAdvanced: false,
		};
	},

	props: {
		target: {
			twoWay: true,
			type: Object,
		},
	},

	methods: {
		onBuyInSelect(event) {
			const selected = event.detail.value;
			const slotProperties = this.slotData[selected];
			if (slotProperties.theme2_1) {
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.theme2_1, slotProperties.theme2_1);
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.layoutViewSet, '');
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.layoutViewName, '');
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.introViewSet, '');
			} else if (slotProperties.layoutViewSet) {
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.theme2_1, '');
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.layoutViewSet, slotProperties.layoutViewSet);
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.layoutViewName, slotProperties.layoutViewName);
				Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.introViewSet, slotProperties.introViewSet);
			} else {
				Editor.error("Unknown slot launch options detected, please contact an engineer in #sag-cocos-creator");
			}
			Editor.SAG.ComponentUtils.changePropValue(this.$el, this.target.buyInID, slotProperties.buyInID);
		},
		refreshBuyInOptions() {
			updateBuyInData();
		},
		toggleAdvancedInput() {
			this.showAdvanced = !this.showAdvanced;
		},
		showTooltip(event) {
			Editor.SAG.Tooltip.show(event.target, 'right');
		},
		hideTooltip(/* event */) {
			Editor.SAG.Tooltip.hide();
		},
	},
});

})();
