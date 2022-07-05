/**
 * Motivation behind this util class is to automate addition of same type [cc.Component.Event Handler]
 * properties to any node that extend Component.
 * In general, adding some events to controllers components will allow technical 
 * artist to bind them with actions from other controllers without help of engineer
 * for example: after PopupController finishes opening animation DiceRollController can execute dice roll action
*/

const EventHandlerProperty = cc.Class({
    name: 'EventHandlerProperty',
    statics: {
        /**
         * will add entrys from "eventList" as [cc.Component.EventHandler] to component properties in editor
         * @param {string[]} eventList 
         * @param {Object} properties 
         * @returns 
         */
        assignListWithProperties(eventList, properties = {}) {
            const eventProps = {};
            eventList.forEach(eventName => {
                eventProps[eventName] = {
                    default: function() {
                        return [];
                    },
                    displayName: 'On' + eventName + 'Action',
                    type: [cc.Component.EventHandler],
                }
            })
            return Object.assign(eventProps, properties);
        },

        /**
         *  Will execute all attached handlers
         * @param {cc.Component.EventHandler[]} events 
         * @param  {...any} params 
         */
        notify(events, ...params) {
            events.forEach(event => event.emit(params));
        }
    },
})

module.exports = EventHandlerProperty;


/*
// Usage example

const EventPropssList = [
    'popupOpened',
    'popupClosed'
];

cc.Class({
    extends: cc.Component,
    
    properties: EventHandlerProperty.assignListWithProperties (EventPropssList, {
        myProp: 'myProp',
        myOtherProp: 'myOtherProp'
    }),
    
    popupOpen() {
       // other code omitted

        EventHandlerProperty.notify(this.popupOpened);
    },

    popupClose() {
        // other code omitted

        EventHandlerProperty.notify(this.popupClosed);
    }
});
*/
