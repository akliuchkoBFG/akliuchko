// hardcoded Milstone character names;

const charactersSpecs = {
    milestone_0: {
        name: 'Daisy the Squid',
        redeemedStep: 0,
    },
    milestone_2: {
        name: 'Bob the Crab',
        redeemedStep: 2,
    },
    milestone_5: {
        name: 'Lizzy the Fish',
        redeemedStep: 5,
    },
    milestone_9: {
        name: 'Stingray Sam',
        redeemedStep: 9,
    },
    milestone_13: {
        name: 'Laila the Whale',
        redeemedStep: 13,
    },
}
cc.Class({
    extends: cc.Component,

    properties: {
        characters: {
            default:null,
            visible: false,
        },

        stepMilestone: 0
    },

    onLoad: function () {
        this.setCharacters();
    },

    setCharacters: function() {
        this.characters = charactersSpecs;
    },

    getCharacters: function(number) {
        if (this.characters) {
            return this.characters[`milestone_${number}`];
        }
    }
});
