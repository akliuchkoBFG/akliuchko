const BaseMissionStepComponent = require('BaseMissionStepComponent');
const MissionPremiumItemView = require('MissionPremiumItemView');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: MissionPremiumItemView,
        // executeInEditMode: true,
        menu: 'Add Mission Component/Step PremiumItem Generator',
        // TODO: help: 'url/to/help/wikipage'
    },

    onUpdateMissionStepData: function() {
        if (!CC_EDITOR) {
            this.generateItem();
        }
    },

    generateItem() {
        let allAwardsData = this.missionStepInterface.getAwardData();
        for (let packageType in allAwardsData) {
            const packageData = allAwardsData[packageType][0];
            const itemModel = this.createItemModel(packageType, packageData);
            if (itemModel) {
                this.node.getComponent("MissionPremiumItemView").setItemModel(itemModel);
            }
        }
    },

    createItemModel: function(type, packageData) {
        switch (type) {
            case 'ProductPackageItemChips':
                return PremiumItemModel.createWithData({type: 'chips', count: packageData.amount});
                break;
            case 'ProductPackageItemCollectionChest':
                const chestType = packageData.promoData.chestName.toLowerCase();
                return PremiumItemModel.createWithData({type: 'chest', count: packageData.amount, group: 'reward', name: chestType});
                break;
            case 'ProductPackageItemFreeSpins':
                //{"ProductPackageItemFreeSpins":[{"buyInID":461,"betSize":"5000","amount":5,"promoData":{"name":"Free Spins","amount":5,"launchData":{"buyInID":461,"theme2_1":"baywatch"},"gridButton":{"buttonImage":"direct_publish___slot_grid_button___baywatch-2x2___baywatch-2x2.png","buttonBundle":{"name":"direct_publish___slot_grid_button___baywatch-2x2","hash":"20c22b24","urls":{"s":"https:\/\/sagnetstorage-a.akamaihd.net\/bundles_dev\/direct_publish___slot_grid_button___baywatch-2x2-20c22b24.s.assetbundle.zip","s2x":"https:\/\/sagnetstorage-a.akamaihd.net\/bundles_dev\/direct_publish___slot_grid_button___baywatch-2x2-20c22b24.s2x.assetbundle.zip"}},"buttonImageLoose":"https:\/\/sagnetstorage-a.akamaihd.net\/bundles_dev\/direct_publish___slot_grid_button___baywatch-2x2-20c22b24.s2x.assetbundle.zip"},"buyInID":461,"slotMachine":"Baywatch VIP","betValue":"125,000"}}]}
                return PremiumItemModel.createWithData({type: 'freeSpins', count: packageData.amount});
                break;
            case 'ProductPackageItemCollectionFrames':
                return PremiumItemModel.createWithTypeAndItemID('frame', packageData.frameID);
                break;
            case 'ProductPackageItemGift':
                return PremiumItemModel.createWithTypeAndItemID('gift', packageData.giftID);
                break;
        }
    }
});
