const BaseMissionStepComponent = require('BaseMissionStepComponent');
const DataTemplateRichTextLabel = require('DataTemplateRichTextLabel');
cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: DataTemplateRichTextLabel,
        executeInEditMode: true,
        menu: 'Labels/Missions/Progress Label Percent',
        help: 'https://bigfishgames.atlassian.net/wiki/spaces/SMS/pages/562593870/Mission+Progress+Label'
    },

    properties: {
    },


    start: function() {
        this.onUpdateMissionStepData();
    },

    onUpdateMissionStepData: function() {
        let rtLabel = this.getComponent('DataTemplateRichTextLabel');
        if (!rtLabel.templateString || rtLabel.templateString == '') {
            rtLabel.templateString = '{percent}%';
        }
        this._populateRTData(rtLabel);
    },

    _populateRTData: function(rtLabel) {
        // Grab the mission data using the interface
        let progress = this.missionStepInterface.getProgressAmount();
        let max = this.missionStepInterface.getProgressMax();
        let percent = Math.floor(progress/max * 100.0);
        let data = {percent: percent};
        rtLabel.setData(data);

        // Set the editor mode properties
        rtLabel.testData = JSON.stringify(data, null, '\t');
    }

});
