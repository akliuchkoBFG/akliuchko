cc.Class({
	extends: cc.PageView,

	editor: CC_EDITOR && {
		menu: 'i18n:MAIN_MENU.component.ui/PageView',
		help: 'i18n:COMPONENT.help_url.pageview',
		inspector: 'packages://inspector/inspectors/comps/ccpageview.js',
		executeInEditMode: false
	},

	properties: {
		_pagesDirty: false,
		_pagesSizeDirty: false,
	},

	// Decouple the need to explicitly add or order page nodes in a page view by listening for content node events
	onLoad() {
		this._super();
		if (this.content) {
			this.content.on('child-added', this._onChildAdded, this);
			this.content.on('child-removed', this._onChildRemoved, this);
			this.content.on('child-reorder', this._doPageDirty, this);
		}
	},

	start() {
		this._super();
		this._doPageDirty();
	},

	onDestroy() {
		this._super();
		if (this.content) {
			this.content.off('child-added', this._onChildAdded, this);
			this.content.off('child-removed', this._onChildRemoved, this);
			this.content.off('child-reorder', this._doPageDirty, this);
		}
	},

	_onChildAdded(evt) {
		this._doPageDirty();
		const child = evt.getUserData();
		child.on('size-changed', this._doSizeDirty, this);
	},

	_onChildRemoved(evt) {
		this._doPageDirty();
		const child = evt.getUserData();
		child.off('size-changed', this._doSizeDirty, this);
	},

	_doPageDirty() {
		this._pagesDirty = true;
	},

	_doSizeDirty() {
		this._pagesSizeDirty = true;
	},

	update(dt) {
		this._super(dt);
		if (this._pagesDirty) {
			this._pagesDirty = false;
			// Refresh page list also triggers the steps needed to clean the page size flag
			this._pagesSizeDirty = false;
			this._refreshPageList();
		} else if (this._pagesSizeDirty) {
			this._pagesSizeDirty = false;
			this._updateAllPagesSize();
		}
	},

	_refreshPageList() {
		this._pages.length = 0;
		this._initPages();
	},

	// Override _getDragDirection to support reversing for different layout directions and multi-page scroll
	_getDragDirection: function (moveOffset) {
		let direction, deltaRemainder, centerOffsets;
		if (this.direction === cc.PageView.Direction.Horizontal) {
			if (moveOffset.x === 0) { return 0; }
			direction = (moveOffset.x > 0 ? 1 : -1);
			deltaRemainder = Math.abs(moveOffset.x);
			centerOffsets = this._scrollCenterOffsetX;
		} else if (this.direction === cc.PageView.Direction.Vertical) {
			if (moveOffset.y === 0) { return 0; }
			direction = (moveOffset.y < 0 ? 1 : -1);
			deltaRemainder = Math.abs(moveOffset.y);
			centerOffsets = this._scrollCenterOffsetY;
		}
		// Reverse page direction for non-standard layout ordering
		if (this._reverse) {
			direction *= -1;
		}
		// Calculate number of pages to scroll based on move delta
		let numPages = 0;
		if (this.sizeMode === cc.PageView.SizeMode.Free) {
			// Free scrolling page view can potentially scroll through multiple pages if the pages are smaller than the container
			let index = this._curPageIdx;
			let nextIndex = index + direction;
			let curCenter, nextCenter;
			while (deltaRemainder > 0) {
				curCenter = centerOffsets[index];
				nextCenter = centerOffsets[nextIndex];
				if (nextCenter == null) {
					// Ran out of pages to scroll
					break;
				}
				const distance = Math.abs(nextCenter - curCenter);
				if (deltaRemainder > distance * this.scrollThreshold) {
					numPages += 1;
				}
				deltaRemainder -= distance;
				index = nextIndex;
				nextIndex = index + direction;
			}
			// Always scrolls a minimum of one page unless it fails both velocity and threshold checks
			numPages = Math.max(1, numPages);
		} else {
			// Unified can only scroll one page at a time
			numPages = 1;
		}
		return direction * numPages;
	},

	_updatePageView() {
		var pageCount = this._pages.length;

		// 当页面数组变化时修改 content 大小
		var layout = this.content.getComponent(cc.Layout);
		if(layout && layout.enabled) {
			layout._updateLayout();
			// SAG Modification: check if the layout direction is normal or reversed
			if (this.direction === cc.PageView.Direction.Horizontal) {
				this._reverse = layout.horizontalDirection !== cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
			} else {
				this._reverse = layout.verticalDirection !== cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
			}
		}
		if (this._curPageIdx >= pageCount) {
			this._curPageIdx = pageCount === 0 ? 0 : pageCount - 1;
			this._lastPageIdx = this._curPageIdx;
		}
		// 进行排序
		for (var i = 0; i < pageCount; ++i) {
			this._pages[i].setSiblingIndex(i);
			// SAG Modification: better calculate the page offsets so that the pages are centered inside the content view
			var page = this._pages[i];
			if (this.direction === cc.PageView.Direction.Horizontal) {
				this._scrollCenterOffsetX[i] = Math.abs(page.x - page.anchorX * page.width - (this.node.width - page.width) / 2);
			} else {
				this._scrollCenterOffsetY[i] = Math.abs(page.y + page.anchorY * page.height + (this.node.height - page.height) / 2);
			}
		}
		// 刷新 indicator 信息与状态
		if (this.indicator) {
			this.indicator._refresh();
		}
		// SAG Modification: emit an event when the page view updates
		this.node.emit('pages-update', this);
	},

	_updateAllPagesSize() {
		// Resync size mode with the layout component and recalculate scroll offsets when size of page view changes
		if (this.sizeMode === cc.PageView.SizeMode.Free) {
			this._syncSizeMode();
			this._updatePageView();
		}
		this._super();
	},

	// Add node-space translation to touch events
	_onTouchBegan: function (event, captureListeners) {
		this._touchBeganPosition = this.node.convertTouchToNodeSpaceAR(event.touch);
		// Skip the cc.PageView implementation
		cc.ScrollView.prototype._onTouchBegan.call(this, event, captureListeners);
	},
	_onTouchEnded: function (event, captureListeners) {
		this._touchEndPosition = this.node.convertTouchToNodeSpaceAR(event.touch);
		// Skip the cc.PageView implementation
		cc.ScrollView.prototype._onTouchEnded.call(this, event, captureListeners);
	},
	_onTouchCancelled: function (event, captureListeners) {
		this._touchEndPosition = this.node.convertTouchToNodeSpaceAR(event.touch);
		// Skip the cc.PageView implementation
		cc.ScrollView.prototype._onTouchCancelled.call(this, event, captureListeners);
	},
});
