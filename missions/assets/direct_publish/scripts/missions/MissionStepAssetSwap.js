const BaseMissionStepComponent = require('BaseMissionStepComponent');

const seedrandom = require('seedrandom');

cc.Class({
    extends: BaseMissionStepComponent,

    editor: CC_EDITOR && {
        requireComponent: cc.Sprite,
        executeInEditMode: true,
        menu: 'Add Mission Component/Mission Step Asset Swap',
        // TODO help: make a wiki url
    },

    properties: {
        spriteFrames:{
            default: [],
            type: [cc.SpriteFrame],
            tooltip: "Array of Sprite Frames to iterate over per mission step."
        },
        backupSpriteFrame: {
            default: null,
            type: cc.SpriteFrame,
            tooltip: "Sprite Frame to show if do not have one in the Sprite Frames array to show."
        },
        randomizeAssets: {
            default: false,
            tooltip: "Iterate through the Sprite Frame array randomly instead of in order. Random seed based on mission id."
        },
    },

    onUpdateMissionStepData: function() {
        //Get the sprite component we listed int he requiredComponents
        let sprite = this.getComponent("cc.Sprite");
        let stepID = parseInt(this.missionStepInterface.stepID);
        let useDefault = true;

        //Seed randoms with the missionID, which will be unique to a player's mission
        const rng = seedrandom('missionID.' + this.missionStepInterface.getMissionID());

        let frames = this.spriteFrames;
        
        if(stepID !== undefined && stepID !== null) {
            // Cycling means that if we have 5 steps but only 3 spriteFrames, when we get to step 4 we cycle back to the beginning
            if(!this.backupSpriteFrame){
                const cycleCount = Math.floor(stepID/frames.length) + 1;
                // Radomize as many times as needed
                if(!!this.randomizeAssets){
                    for(let i = 0; i < cycleCount; i++){
                        frames = this._randomizeSpriteOrder(rng);
                    }
                }
                stepID = stepID % frames.length;
            }
            // If you want random assets but not cycling. What you get is a randomization of the spriteFrames at first but then after
            // those are iterated over you only see the default.
            else {
                if(this.randomizeAssets){
                    frames = this._randomizeSpriteOrder(rng);
                }
            }

            if(frames[stepID]){
                sprite.spriteFrame = frames[stepID];
                useDefault = false;
            }
        }

        if(this.backupSpriteFrame && useDefault) {
            sprite.spriteFrame = this.backupSpriteFrame;
        }
    },

    
    _randomizeSpriteOrder: function(rngFunc) {
        let randomOrderFrames = [this.spriteFrames[0]];
        
        let rngSprites = this.spriteFrames.map((item) => { 
            return [item,rngFunc()];
        });
        
        randomOrderFrames = rngSprites.sort(function(a,b){
            return a[1] - b[1];
        });
        let fixedRandomOrdeFrames = randomOrderFrames.map((item) => {return item[0]});

        return fixedRandomOrdeFrames;
    },

});
