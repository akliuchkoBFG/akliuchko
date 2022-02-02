// Ensure that shared component utilities get included before compiling other script components
// This script is marked as a plugin script that executes in the Editor to guarantee execution prior to components
CC_EDITOR && (function() {
	/* global
		_Scene
	*/
	const JS = cc.js;
	const lodash = Editor.require('lodash');

	// Create a Self Aware specific namespace for shared editor functionality
	Editor.SAG = Editor.SAG || {};

	// Utilities for custom editor component interfaces
	const ComponentUtils = {
		changePropValue(vueElem, prop, value) {
			prop.value = value;
			Editor.UI.fire(vueElem, "target-change", {
				bubbles: true,
				detail: {
					type: prop.type,
					path: prop.path,
					value: prop.value,
				},
			});
		},
		registerPropertyInspector(componentName, filterCallback, identifier) {
			identifier = identifier || componentName;
			Editor.SAG._properties = Editor.SAG._properties || {};
			Editor.SAG._properties[identifier] = {componentName, filterCallback};
		},
		getComponentType(prop) {
			// Force use of array property that checks for custom components
			if (prop.compType === 'cc-array-prop') {
				return 'custom-array-prop';
			}
			const type = prop.attrs.typename || prop.attrs.type || 'UnknownType';
			const components = Object.entries(Editor.SAG._properties);
			for (const [identifier, propertyData] of components) {
				let filterFn, compType;
				if (typeof propertyData === 'function') {
					// Old property data format mapped from component name to filter function
					filterFn = propertyData;
					compType = identifier;
				} else {
					// New property data format has an object that includes component name and filter function
					filterFn = propertyData.filterCallback;
					compType = propertyData.componentName;
				}
				try {
					if (filterFn(type, prop)) {
						return compType;
					}
				} catch (e) {
					Editor.error([
						"Error running filter function for custom property type: " + compType,
						"Type: " + type,
						"Prop: " + JSON.stringify(prop, null, '\t'),
					].join('\n'));
				}
			}
			// Object properties not handled by a custom property component should check for nested custom properties
			if (prop.compType === 'cc-object-prop') {
				return 'custom-object-prop';
			}
			return prop.compType;
		},
	};

	// Returns an inspector URL for a Vue component definition file located in this extension package
	const ComponentInspector = function(componentName) {
		// Uses a cache for inspector URLs by componentName, clears in SharedComponentUtils.js on package reload
		// This will clear cache for non-component file changes, but avoids ever having stale component definitions
		if (!Editor.SAG._inspectors) {
			Editor.SAG._inspectors = {};
		}
		if (!Editor.SAG._inspectors[componentName]) {
			Editor.SAG._inspectors[componentName] = `packages://self-aware-components/components/${componentName}.js?t=${Date.now()},`;
		}
		return Editor.SAG._inspectors[componentName];
	};

	// Interface for modifying preview server load data from editor components
	const provideLoadData = function(property, value) {
		Editor.Ipc.sendToMain('sakit-preview-server:add-load-data-prop', property, value);
	};


	const TOOLTIP_CONFIG = {
		left: {
			position: '20px',
			left(sourceRect/* , tooltipRect*/) {
				return sourceRect.left - 10;
			},
			top(sourceRect, tooltipRect) {
				return sourceRect.top - tooltipRect.height - 10;
			},
		},
		right: {
			position: '-20px',
			left(sourceRect, tooltipRect) {
				return sourceRect.left - tooltipRect.width + 30;
			},
			top(sourceRect, tooltipRect) {
				return sourceRect.top - tooltipRect.height - 10;
			},
		},
	};
	const Tooltip = {
		_sharedEl: null,
		_timeout: null,
		init() {
			this._sharedEl = new Editor.UI.Hint();
			const elem = this._sharedEl;
			elem.style.display = 'none';
			elem.style.position = 'absolute';
			elem.style.maxWidth = '200px';
			elem.style.zIndex = '999';
			elem.classList = 'bottom shadow';
			document.body.appendChild(elem);
		},
		// Show a tooltip for a given element. Element must have a 'tooltip' attribute with the desired text
		// (optional) hintPosition sets the position property on the ui-hint (see Cocos Creator UI-Kit Preview)
		show(el, arrowSide) {
			const text = el.getAttribute('tooltip');
			if (!text) {
				return;
			}

			const elem = this._sharedEl;
			arrowSide = arrowSide || el.getAttribute('tooltip-target');
			const config = TOOLTIP_CONFIG[arrowSide] || TOOLTIP_CONFIG.left;
			elem.style.display = 'none';
			elem.innerText = text;
			// Clear out existing arrow style to allow for switching between right and left tooltips
			elem.$arrow.style.left = '';
			elem.$arrow.style.right = '';
			elem.position = config.position;
			this._timeout = setTimeout(() => {
				this._timeout = null;
				elem.style.display = 'block';
				const sourceRect = el.getBoundingClientRect();
				const tooltipRect = elem.getBoundingClientRect();
				elem.style.left = config.left(sourceRect, tooltipRect);
				elem.style.top = config.top(sourceRect, tooltipRect);
			}, 200);
		},
		// Hide any currently active tooltips and clear the pending timeout that would show a new tooltip
		hide() {
			clearTimeout(this._timeout);
			this._timeout = null;
			this._sharedEl.style.display = 'none';
		},
	};
	Tooltip.init();

	Editor.SAG.ComponentUtils = ComponentUtils;
	Editor.SAG.ComponentInspector = ComponentInspector;
	Editor.SAG.Tooltip = Tooltip;
	Editor.SAG.provideLoadData = provideLoadData;

	// Add a listener for clearing component inspector cache
	// This can't live in scene script because it happens during package load when scene scripts are not initialized
	// But it does need to execute in the context of the scene panel
	Editor.SAG._cacheListener && Editor.SAG._cacheListener.clear();
	Editor.SAG._cacheListener = new Editor.IpcListener();
	Editor.SAG._cacheListener.on('self-aware-components:clear-inspector-cache', function() {
		Editor.SAG._inspectors = {};
	});

	// Change the component menu sorting behavior. This is a modified version of a function pulled from
	// editor/page/scene-utils/utils.js
	// This prioritizes our top level component groups over builtin components and sorts groups above loose components
	//  for groups with a mix of components and groups in the same list
	_Scene.updateComponentMenu = function() {
		cc._componentMenuItems = lodash.sortBy(cc._componentMenuItems, (menuItem) => {
			const menuPath = menuItem.menuPath;
			const parts = menuPath.split('/');
			// Lowercase class name so it sorts below groups
			parts[parts.length - 1] = parts[parts.length - 1].toLowerCase();
			// Capitalize groups to prioritize over loose components
			for (let i = parts.length - 2; i >= 1; --i) {
				parts[i] = parts[i].toUpperCase();
			}
			// Separate base Cocos components from custom menu paths
			if (parts[0].indexOf('i18n:MAIN_MENU.component') === 0) {
				parts[0] = parts[0].toLowerCase();
			} else {
				parts[0] = parts[0].toUpperCase();
			}
			return parts.join('/');
		});
		for (var e = [], n = 0; n < cc._componentMenuItems.length; ++n) {
			var t = cc._componentMenuItems[n],
				o = t.menuPath;
			e.push({
				path: Editor.i18n.formatPath(o),
				panel: "scene",
				message: "scene:add-component",
				params: [JS._getClassId(t.component)]
			});
		}
		Editor.Menu.register("add-component", e, !0);
		Editor.MainMenu.update(Editor.T("MAIN_MENU.component.title"), e);
	};

})();
