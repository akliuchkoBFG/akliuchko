const EasingType = cc.Enum({
	None: 0,
	ease: 1,
	easeIn: 2,
	easeOut: 3,
	easeInOut: 4,
	easeBounceIn: 5,
	easeBounceOut: 6,
	easeBounceInOut: 7,
	easeBackIn: 8,
	easeBackOut: 9,
	easeBackInOut: 10,
	// Easing that requires a period parameter
	// TODO: add support or default value or evaluate not supporting from tools
	// easeElasticIn: 11,
	// easeElasticOut: 12,
	// easeElasticInOut: 13,
	easeExponentialIn: 14,
	easeExponentialOut: 15,
	easeExponentialInOut: 16,
	easeCubicActionIn: 17,
	easeCubicActionOut: 18,
	easeCubicActionInOut: 19,
	easeCircleActionIn: 20,
	easeCircleActionOut: 21,
	easeCircleActionInOut: 22,
});

// Unfortunately cc.easeBezierAction doesn't implement a 2D cubic bezier. The normal signature for 
// should be cubic-bezier(p1x, p1y, p2x, p2y). The Cocos implmentation only allows for 
// cc.easeBezierAction(0, p1y, p2y, 1) due to simplification of the math that locks p1x = 1/3 and p2x = 2/3 
// and limits the possible traditional 2D curves to those with control points along those lines
// For further reading and additional context: https://math.stackexchange.com/q/26846/
// Target as close as possible to css built-in easing functions given the cocos implementation
// See: https://drafts.csswg.org/css-timing/#cubic-bezier-timing-functions
// Ideally we could implement a proper 2D bezier, but easing requires a native object to function properly


// Easing function overrides for easing that requires parameters or maps to a different easing strategy
const EasingFunctions = {
	ease: function () {
		// Rough approximation for cubic-bezier(0.25, 0.1, 0.25, 1)
		return cc.easeBezierAction(0, 0.1, 1, 1);
	},
	easeIn: function() {
		// Close approximation to cubic-bezier(0.42, 0, 1, 1)
		return cc.easeBezierAction(0, 0.05, 0.41, 1);
	},
	easeOut: function() {
		// Close approximation to cubic-bezier(0, 0, 0.58, 1);
		return cc.easeBezierAction(0, 0.59, 0.95, 1);
	},
	easeInOut: function() {
		// Rough approximation for cubic-bezier(0.42, 0, 0.58, 1)
		return cc.easeBezierAction(0, 0, 1, 1);
	},
};

// Look up and apply an easing function to the given ccAction
const addEasingToAction = function addEasingToAction(ccAction, easingType) {
	if (easingType === EasingType.None) {
		return;
	}
	if (!ccAction.easing) {
		cc.error("Unable to apply easing to action, action does not support easing");
		return;
	}
	const easingName = EasingType[easingType];
	let easingObj = {};
	if (EasingFunctions[easingName]) {
		easingObj = EasingFunctions[easingName]();
	} else if (cc[easingName]) {
		easingObj = cc[easingName]();
	}
	if (!easingObj.easing) {
		cc.error("Unable to apply easing to action using: " + easingName);
		return;
	}
	ccAction.easing(easingObj);
};

module.exports = {
	Type: EasingType,
	addEasingToAction: addEasingToAction,
};