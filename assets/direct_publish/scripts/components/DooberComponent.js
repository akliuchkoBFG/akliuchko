/* global
	_ccsg
*/
const NodeReference = require("NodeReference");
const Easing = require("Easing");
const DooberParticle = require("DooberParticle");

cc.Class({
	extends: cc.Component,
	editor: CC_EDITOR && {
		disallowMultiple: true,
		executeInEditMode: true
	},
	properties: {

		/* path properties */
		preview: {
			default: false,
			editorOnly: true,
			notify: CC_EDITOR && function () {
				this._clearDebug();
				if (this.preview) {
					this._debugDraw();
				}
				cc.engine.repaintInEditMode();
			},
			animatable: false,
			tooltip: 'Show the Bezier path in the editor'
		},

		emitting: {
			default: false,
			tooltip: 'Whether the particle system is emitting new particles',
			notify(wasEmitting) {
				// Reset the system properties when emitting is toggled to false
				if (!this.emitting && wasEmitting) {
					this.stopParticles();
				}
			},
		},

		startSpread: {
			default: new cc.Vec2(),
		},
		spread: {
			default: 1,
			tooltip: "Smaller values: straight line. Larger values: teardrop shape"
		},
		spreadOffset: {
			default: 0,
			tooltip: "Skew the teardrop shape left or right (positive or negative)"
		},
		taperLocation: {
			default: .5,
			tooltip: "relative to the distance between start and end\n0: tapers at start, 1: tapers at end"
		},
		taperOffset: {
			default: new cc.Vec2(),
			tooltip: "offset the middle control point by a constant amount",
		},
		useSAKitNode: {
			default: false
		},
		saEndNode: {
			default: "",
			displayName: "SA End Node",
			tooltip: 'View name for a uniquely named SAView to use as an endpoint',
			visible: function() { return this.useSAKitNode; },
		},
		endNode: {
			default: function () {
				return new NodeReference();
			},
			visible: function() { return !this.useSAKitNode; },
			type: NodeReference,
			tooltip: 'X,Y pairs for Points array will be relative to the coordinate space of a linked node.',
		},
		endOffset: {
			default: new cc.Vec2(),
		},
		endSpread: {
			default: new cc.Vec2(),
		},
		duration: 1,
		durationVar: {
			default: 0,
			displayName: "DurationVariance"
		},
		killDelay: {
			default: 0,
			tooltip: "Keep the particle alive after it reaches its destination. Useful for particle trails"
		},
		easing: {
			default: Easing.Type.None,
			type: Easing.Type,
			tooltip: "Easing function to apply to this animation",
		},

		/* particle properties */
		prefab:cc.Prefab,
		emitDuration: {
			default: 1.0,
			type: 'Float',
			tooltip: 'How long to emit particles (in seconds)',
			notify() {
				this._updateEmitRate();
			},
		},
		totalParticles: {
			default: 50,
			type: 'Integer',
			notify() {
				this._updateEmitRate();
			},
		},
		rotationRange: {
			default: new cc.Vec2(0, 0),
			displayName: "Rotation Start/End",
		},
		scaleRange: {
			default: new cc.Vec2(1, 1),
			displayName: "Scale Start/End",
		},

		_particles: [],
		_currentTotalParticles: 0,
		_updatesSize: false,
		_updatesRotation: false,
	},

	onLoad: function () {
		this._lastEmit = 0;
		this._updateEmitRate();
	},

	_updateEmitRate: function() {
		this._dtEmitRate = this.emitDuration / this.totalParticles;
	},

	loadParticles(data) {
		if (!this.prefab) {
			return Promise.resolve();
		}
		// Create a node from prefab
		const node = cc.instantiate(this.prefab);
		const dooberParticle = node.getComponent(DooberParticle);
		if (!dooberParticle) {
			return Promise.resolve();
		}
		// Alpha out and add an instance of the particle to the hierarchy for loading purposes
		const origOpacity = node.opacity;
		node.opacity = 0;
		this.node.addChild(node);
		const loadPromise = dooberParticle.loadParticle(data)
		.then(() => {
			node.opacity = origOpacity;
			this.node.removeChild(node);
			this._cleanupPrefab();
			this.prefab = node;
		});
		return loadPromise;
	},

	_getEndPos: function _getEndPos() {
		let node = null;
		if (this.useSAKitNode){
			if(this.saEndNode){
				node = SAView.getNamedView(this.saEndNode);
			}
		} else if (this.endNode instanceof NodeReference) {
			node = this.endNode.get();
		}
		if (node) {
			const worldSpace = node.convertToWorldSpaceAR(this.endOffset);
			const pos = this.node.convertToNodeSpaceAR(worldSpace);
			// something in the shimming of cc.Vec2 is not working correctly... this is a temprory fix
			return new cc.Vec2(pos.x, pos.y);
		}
		return this.endOffset;
	},

	_randomCurvePath: function _randomCurvePath(startPoint){
		// TODO: artist-controlled distributions for any instance of Math.random()?
		// TODO: go back in time and make Brendan Eich add operator overloads to the JS spec
		const end = this._getEndPos().add( new cc.Vec2(this.endSpread.x * (Math.random() - .5), this.endSpread.y * (Math.random() - .5)));
		const perp = new cc.Vec2(-end.y, end.x);
		const center = this.taperOffset.add((startPoint).lerp(end, this.taperLocation));
		const scale = this.spread * (Math.random() - .5) + this.spreadOffset;
		return [startPoint, center.add(perp.mul(scale)), end];
	},

	_randomRange(vec){
		return vec.x + Math.random() * (vec.y - vec.x);
	},

	createParticle: function() {
		const particle = cc.instantiate(this.prefab);
		const startPoint = new cc.Vec2(this.startSpread.x * (Math.random() - .5), this.startSpread.y * (Math.random() - .5));
		particle.rotation = this.rotationRange.x; // this._randomRange(this.rotationRange);
		particle.scale =  this.scaleRange.x;   // this._randomRange(this.scaleRange);
		particle.x = startPoint.x;
		particle.y = startPoint.y;
		this.node.addChild(particle);
		particle.runAction(this._createCurveAnimation(startPoint));

		const particleComp = particle.getComponent(DooberParticle);
		if (particleComp) {
			particleComp.emit();
		}

		// TODO: cache particles to destroy on kill
		// this._particles.add(particle);
		// TODO: Use pooling if performance is bad on low-end devices
		//  https://docs.cocos2d-x.org/creator/manual/en/scripting/pooling.html
	},

	_createCurveAnimation: function(startPos) {
		var path = this._randomCurvePath(startPos);
		const animDuration = Math.max(0.0001, this.duration + (Math.random() - .5) * this.durationVar);
		const animation =  cc.spawn(cc.bezierTo(animDuration, path),
									cc.scaleTo(animDuration, this.scaleRange.y),
									cc.rotateBy(animDuration, this.rotationRange.y));

		Easing.addEasingToAction(animation, this.easing);
		return cc.sequence([animation, cc.delayTime(this.killDelay), cc.removeSelf()]);
	},

	onFocusInEditor: CC_EDITOR && function () {
		this._clearDebug();
		if (this.preview) {
			this._debugDraw();
		}
		this._focus = true;
		cc.engine.repaintInEditMode();
	},

	onLostFocusInEditor: CC_EDITOR && function () {
		this._clearDebug();
		if (this._debugNode) {
			this._debugNode.removeFromParent();
			this._debugNode = null;
		}
		this._focus = false;
		cc.engine.repaintInEditMode();
	},

	_clearDebug: function _clearDebug() {
		this._debugNode && this._debugNode.clear();
	},

	_debugDraw: function _debugDraw() {
		let debug;
		if (!this._debugNode) {
			debug = new _ccsg.GraphicsNode();
			this.node._sgNode.addChild(debug);
			this._debugNode = debug;
		} else {
			debug = this._debugNode;
		}

		const origEnd =this._getEndPos();
		const starts = [new cc.Vec2(0, 0), this.startSpread.mul(.5), this.startSpread.mul(-.5)];
		const ends = [origEnd, origEnd.add(this.endSpread.mul(.5)), origEnd.add(this.endSpread.mul(-.5))];


		const golden_ratio = (1 + 2.236) / 2;
		let hue = 0;
		for(var i=0; i < starts.length; i++){
			for(var j=0; j < ends.length; j++){
				const s = starts[i]; // could be randomly spread?
				const e = ends[j];
				const perp = new cc.Vec2(-e.y, e.x);
				const center = this.taperOffset.add((new cc.Vec2(s.x, s.y)).lerp(e, this.taperLocation));

				let scale = this.spread * (-.5) + this.spreadOffset;
				let b = center.add(new cc.Vec2(perp.x * scale, perp.y * scale));
				// Graphics setup
				debug.lineWidth = 5;
				hue = (hue + golden_ratio) % 1;
				debug.strokeColor = cc.Color.RED.fromHSV(hue, .8, .8);
				debug.fillColor = cc.Color.RED.fromHSV(hue, .7, .7);
				debug.moveTo(s.x, s.y);
				debug.bezierCurveTo(s.x, s.y, b.x, b.y, e.x, e.y);

				scale = this.spread * (.5) + this.spreadOffset;
				b = center.add(new cc.Vec2(perp.x * scale, perp.y * scale));
				debug.moveTo(s.x, s.y);
				debug.bezierCurveTo(s.x, s.y, b.x, b.y, e.x, e.y);
				debug.stroke();
			}
		}
	},
	
	startParticles: function (){
		this.emitting = true;
	},
	// soft stop, particles in flight will still finish their animation
	stopParticles: function(){
		this.emitting = false;
		this._currentTotalParticles = 0;
		this._lastEmit = 0;
		this._particles = [];
	},
	// immediate stop, destroys all in-flight particles
	killParticles: function() {
		this.stopParticles();
	},

	// called every frame, uncomment this function to activate update callback
	update: CC_EDITOR
		? function(){
			if(this.preview && this._focus){
				this._clearDebug();
				this._debugDraw();
			}
		}
		: function (dt) {
			if(this.emitting){
				this._lastEmit += dt;
				if(this._lastEmit > this._dtEmitRate){
					const emitCount = Math.floor(this._lastEmit / this._dtEmitRate);
					// Cap particles emitted to total number of particles in the system
					const particleCount = Math.min(this.totalParticles - this._currentTotalParticles, emitCount);
					if(particleCount > 0) {
						for(let i = 0; i < particleCount; i++){
							this.createParticle();
							this._currentTotalParticles++;
						}
					}
					this._lastEmit -= emitCount * this._dtEmitRate;
				}
			}
		},

	_cleanupPrefab() {
		// Prefab can be replaced by a cc.Node after performing a load action, destroy that node when cleaning up
		if (this.prefab instanceof cc.Node) {
			this.prefab.destroy();
			this.prefab = null;
		}
	},

	onDestroy() {
		this._cleanupPrefab();
	},
});
