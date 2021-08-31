const TAG = "CompetitionMeter";
const ComponentLog = require('ComponentSALog')(TAG);

const seedrandom = require('seedrandom');
const MissionInterface = require('MissionInterface');

cc.Class({
    extends: cc.Component,
    mixins: [ComponentLog],

    editor: CC_EDITOR && {
        menu: 'Add UI Component/Competition Meter',
        executeInEditMode: true,
        requireComponent: cc.Animation,
    },

    properties: {
        competition_ratio: {
            default: 0.5,
            type: cc.Float,
            slide: true,
            tooltip: 'The ratio of the competition meter left versus right. 1.0 means left side is the full meter whereas 0.0 means the right side is the full meter.',
            max: 1,
        },

        bounds: {
            default: 0,
            type: cc.Float,
            slide: true,
            tooltip: 'The padded bounds that the meter will not progress beyond.',
            max: 0.5,
        },

        change_increment: {
            default: "",
            tooltip: 'Time increment to allow a change in the meter. Format: 00:00:00:00 where the format represents days:hours:minutes:seconds',
        },

        mission_interface: {
            default: null,
            type: MissionInterface,
            tooltip: 'MissionInterface reference for checking time related items for the mission',
        },
    },

    start: function() {
         // this.max_progress = 1;
        const rng = seedrandom(this.getTimeSeed());
        const random = Math.round((rng() + Number.EPSILON) * 100) / 100;
        this.competition_ratio = (random * ((1 - this.bounds) - this.bounds)) + this.bounds;

        this.log.d('ratio: ' + this.competition_ratio);
        this.log.d('bounds: ' + this.bounds);

        const anim = this.getComponent(cc.Animation);
        const animState = anim.play();

        const animLength = animState.duration;

        anim.setCurrentTime(this.competition_ratio * animLength);
        anim.pause();
    },

    // Calculate seed value using the change increment (if provided) and the total length of the mission
    getTimeSeed: function() {
        let seed = 0;
        if(this.mission_interface && this.change_increment !== "") {
            // The length of time to maintain the same seed
            const duration = this.convertToSeconds();
            seed = Math.floor(this.mission_interface.getSecondsRemaining() / duration);
            this.log.d("Seconds Remaining: " + this.mission_interface.getSecondsRemaining() + "/" + this.convertToSeconds());
        }
        this.log.d("Seeding with: " + seed);
        return seed;
    },

    convertToSeconds: function() {
        const days = parseInt(this.change_increment.split(':')[0], 10);
        const hours = parseInt(this.change_increment.split(':')[1], 10);
        const minutes = parseInt(this.change_increment.split(':')[2], 10);
        const seconds = parseInt(this.change_increment.split(':')[3], 10);

        this.log.d('Entered Time: ' + days + ':' + hours + ':' + minutes + ':' + seconds);

        let timeValidWarn = false;
        // Verification warnings
        if(days > 1) {
            this.log.w('Days provided by change increment exceed 1 and could reduce randomness of results');
            timeValidWarn = true;
        }

        if(hours > 23) {
            this.log.w('Hours provided by change increment matches or exceeds the number of hours in a day');
            timeValidWarn = true;
        }
        if(minutes > 59) {
            this.log.w('Minutes provided by change increment matches or exceeds the number of minutes in an hour');
            timeValidWarn = true;
        }
        if(seconds > 59) {
            this.log.w('Seconds provided by change increment matches or exceeds the number of seconds in a minute');
            timeValidWarn = true;
        }

        if(timeValidWarn) {
            this.log.w('One or more of the time format elements provided in the change increment is out of the bounds of intended values. Please make sure your time values are correct.');
        }
        if(isNaN(days) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            this.log.e('Input error for time value, please check format for the change increment must be 00:00:00:00 where each 00 is a valid number.');
        }


        // calculate all items as a number of seconds, e.g. seconds = days * (hours in a day) * (minutes in an hour) * (seconds in a minute) etc.
        return (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds;
    },

});
