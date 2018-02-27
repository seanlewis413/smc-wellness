"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var view_1 = require("tns-core-modules/ui/core/view");
var label_1 = require("tns-core-modules/ui/label");
var observable_1 = require("tns-core-modules/data/observable");
var stack_layout_1 = require("tns-core-modules/ui/layouts/stack-layout");
var proxy_view_container_1 = require("tns-core-modules/ui/proxy-view-container");
var pager_common_1 = require("./pager.common");
function notifyForItemAtIndex(owner, nativeView, view, eventName, index) {
    var args = {
        eventName: eventName,
        object: owner,
        index: index,
        view: view,
        ios: nativeView,
        android: undefined
    };
    owner.notify(args);
    return args;
}
var main_queue = dispatch_get_current_queue();
var common = require("./pager.common");
global.moduleMerge(common, exports);
var Pager = (function (_super) {
    __extends(Pager, _super);
    function Pager() {
        var _this = _super.call(this) || this;
        _this.layoutWidth = 0;
        _this.layoutHeight = 0;
        _this.cachedViewControllers = [];
        _this._viewMap = new Map();
        var that = new WeakRef(_this);
        _this._orientation = 0;
        _this._transformer = 1;
        var nsVal = [0.0];
        var nsKey = [UIPageViewControllerOptionInterPageSpacingKey];
        _this._options = NSDictionary.dictionaryWithObjectsForKeys(nsKey, nsVal);
        _this._ios = UIPageViewController.alloc().initWithTransitionStyleNavigationOrientationOptions(_this._transformer, _this._orientation, _this._options);
        _this.delegate = PagerViewControllerDelegate.initWithOwner(that);
        _this.nativeViewProtected = _this._ios.view;
        _this.dataSource = PagerDataSource.initWithOwner(new WeakRef(_this));
        return _this;
    }
    Pager.prototype.itemTemplateUpdated = function (oldData, newData) { };
    Object.defineProperty(Pager.prototype, "transformer", {
        get: function () {
            return this._transformer;
        },
        enumerable: true,
        configurable: true
    });
    Pager.prototype.eachChildView = function (callback) {
        if (this._viewMap.size > 0) {
            this._viewMap.forEach(function (view, key) {
                callback(view);
            });
        }
    };
    Pager.prototype.updateNativeIndex = function (oldIndex, newIndex) {
        this._navigateNativeViewPagerToIndex(oldIndex, newIndex);
    };
    Pager.prototype.updateNativeItems = function (oldItems, newItems) { };
    Pager.prototype.refresh = function (hardReset) {
        if (hardReset === void 0) { hardReset = false; }
        this._viewMap.forEach(function (view, index, array) {
            if (!(view.bindingContext instanceof observable_1.Observable)) {
                view.bindingContext = null;
            }
        });
        if (this.isLoaded) {
            if (hardReset) {
                this._initNativeViewPager();
            }
            this.requestLayout();
            this._isDataDirty = false;
        }
        else {
            this._isDataDirty = true;
        }
    };
    Pager.prototype[pager_common_1.itemTemplatesProperty.getDefault] = function () {
        return null;
    };
    Pager.prototype[pager_common_1.itemTemplatesProperty.setNative] = function (value) {
        this._itemTemplatesInternal = new Array(this._defaultTemplate);
        if (value) {
            this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
        }
        this.refresh(true);
    };
    Pager.prototype.getViewController = function (selectedIndex, refresh) {
        if (refresh === void 0) { refresh = false; }
        var vc;
        var cachedCtrl = this.cachedViewControllers[selectedIndex];
        if (cachedCtrl && refresh) {
            cachedCtrl.clear();
            this.cachedViewControllers[selectedIndex] = null;
        }
        else if (cachedCtrl) {
            vc = cachedCtrl.get();
        }
        if (!vc) {
            vc = PagerView.initWithOwnerTag(new WeakRef(this), selectedIndex);
            var view = void 0;
            if (this.items && this.items.length) {
                view = this._getItemTemplate(selectedIndex).createView();
                var _args = notifyForItemAtIndex(this, view ? view.nativeView : null, view, pager_common_1.ITEMLOADING, selectedIndex);
                view = _args.view || this._getDefaultItemContent(selectedIndex);
                if (view instanceof proxy_view_container_1.ProxyViewContainer) {
                    var sp = new stack_layout_1.StackLayout();
                    sp.addChild(view);
                    view = sp;
                }
                if (view) {
                    this.cachedViewControllers[selectedIndex] = new WeakRef(vc);
                    this._prepareItem(view, selectedIndex);
                    this._viewMap.set(selectedIndex, view);
                }
            }
            else {
                var lbl = new label_1.Label();
                lbl.text = 'Pager.items not set.';
                view = lbl;
            }
            if (!view.parent) {
                this._addView(view);
            }
            var nativeView = view.nativeView;
            if (!nativeView.superview) {
                vc.view.addSubview(view.nativeView);
            }
            this.prepareView(view);
        }
        return vc;
    };
    Pager.prototype[pager_common_1.itemsProperty.getDefault] = function () {
        return null;
    };
    Pager.prototype[pager_common_1.itemsProperty.setNative] = function (value) {
        pager_common_1.selectedIndexProperty.coerce(this);
        this.refresh(true);
    };
    Pager.prototype.onLoaded = function () {
        _super.prototype.onLoaded.call(this);
        this.refresh(true);
        if (!this.disableSwipe) {
            this._ios.dataSource = this.dataSource;
        }
        this._ios.delegate = this.delegate;
    };
    Object.defineProperty(Pager.prototype, "disableSwipe", {
        get: function () {
            return this._disableSwipe;
        },
        set: function (value) {
            this._disableSwipe = value;
            if (this._ios && value) {
                this._ios.dataSource = null;
            }
            else {
                this._ios.dataSource = this.dataSource;
            }
        },
        enumerable: true,
        configurable: true
    });
    Pager.prototype.onUnloaded = function () {
        this._ios.delegate = null;
        _super.prototype.onUnloaded.call(this);
    };
    Pager.prototype.disposeNativeView = function () {
        this._clearCachedItems();
        _super.prototype.disposeNativeView.call(this);
    };
    Pager.prototype.prepareView = function (view) {
        if (this.widthMeasureSpec !== undefined &&
            this.heightMeasureSpec !== undefined) {
            var result = view_1.View.measureChild(this, view, this.widthMeasureSpec, this.heightMeasureSpec);
            view_1.View.layoutChild(this, view, 0, 0, result.measuredWidth, result.measuredHeight);
        }
    };
    Pager.prototype.onMeasure = function (widthMeasureSpec, heightMeasureSpec) {
        this.widthMeasureSpec = widthMeasureSpec;
        this.heightMeasureSpec = heightMeasureSpec;
        var width = view_1.layout.getMeasureSpecSize(widthMeasureSpec);
        var widthMode = view_1.layout.getMeasureSpecMode(widthMeasureSpec);
        var height = view_1.layout.getMeasureSpecSize(heightMeasureSpec);
        var heightMode = view_1.layout.getMeasureSpecMode(heightMeasureSpec);
        var view = this._viewMap.get(this.selectedIndex);
        var _a = view_1.View.measureChild(this, view, widthMeasureSpec, heightMeasureSpec), measuredWidth = _a.measuredWidth, measuredHeight = _a.measuredHeight;
        measuredWidth = Math.max(measuredWidth, this.effectiveMinWidth);
        measuredHeight = Math.max(measuredHeight, this.effectiveMinHeight);
        var widthAndState = view_1.View.resolveSizeAndState(measuredWidth, width, widthMode, 0);
        var heightAndState = view_1.View.resolveSizeAndState(measuredHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    };
    Pager.prototype.onLayout = function (left, top, right, bottom) {
        _super.prototype.onLayout.call(this, left, top, right, bottom);
        this.layoutWidth = right - left;
        this.layoutHeight = bottom - top;
        if (this._viewMap && this._viewMap.has(this.selectedIndex)) {
            var view = this._viewMap.get(this.selectedIndex);
            view_1.View.layoutChild(this, view, 0, 0, this.layoutWidth, this.layoutHeight);
        }
    };
    Pager.prototype._clearCachedItems = function () {
        var _this = this;
        if (!this.cachedViewControllers) {
            return;
        }
        this.cachedViewControllers.forEach(function (vcRef) {
            if (vcRef && typeof vcRef.clear === 'function') {
                vcRef.clear();
            }
        });
        this._viewMap.forEach(function (val, key) {
            if (val && val.parent === _this) {
                _this._removeView(val);
            }
        });
        this._viewMap.clear();
    };
    Pager.prototype._viewControllerRemovedFromParent = function (controller) {
        controller.tag = undefined;
        controller.view = undefined;
        controller.owner = undefined;
    };
    Pager.prototype._initNativeViewPager = function () {
        var ref = new WeakRef(this);
        var controller = this.getViewController(this.selectedIndex, true);
        dispatch_async(main_queue, function () {
            var owner = ref.get();
            owner._ios.setViewControllersDirectionAnimatedCompletion([controller], 0, false, null);
        });
    };
    Pager.prototype._navigateNativeViewPagerToIndex = function (fromIndex, toIndex) {
        var vc = this.getViewController(toIndex);
        var view = this._viewMap.get(toIndex);
        this.prepareView(view);
        if (!vc)
            throw new Error('no VC');
        var direction = fromIndex < toIndex
            ? 0
            : 1;
        var ref = new WeakRef(this);
        dispatch_async(main_queue, function () {
            var owner = ref.get();
            owner._ios.setViewControllersDirectionAnimatedCompletion(NSArray.arrayWithObject(vc), direction, false, null);
        });
    };
    return Pager;
}(pager_common_1.PagerBase));
exports.Pager = Pager;
var PagerViewControllerDelegate = (function (_super) {
    __extends(PagerViewControllerDelegate, _super);
    function PagerViewControllerDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PagerViewControllerDelegate.prototype, "owner", {
        get: function () {
            return this._owner.get();
        },
        enumerable: true,
        configurable: true
    });
    PagerViewControllerDelegate.initWithOwner = function (owner) {
        var pv = new PagerViewControllerDelegate();
        pv._owner = owner;
        return pv;
    };
    PagerViewControllerDelegate.prototype.pageViewControllerDidFinishAnimatingPreviousViewControllersTransitionCompleted = function (pageViewController, finished, previousViewControllers, completed) {
        if (finished) {
            var vc = pageViewController.viewControllers[0];
            var owner = this.owner;
            if (owner) {
                owner.selectedIndex = vc.tag;
            }
        }
    };
    PagerViewControllerDelegate.ObjCProtocols = [UIPageViewControllerDelegate];
    return PagerViewControllerDelegate;
}(NSObject));
var PagerDataSource = (function (_super) {
    __extends(PagerDataSource, _super);
    function PagerDataSource() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PagerDataSource.prototype, "owner", {
        get: function () {
            return this._owner.get();
        },
        enumerable: true,
        configurable: true
    });
    PagerDataSource.initWithOwner = function (owner) {
        var ds = new PagerDataSource();
        ds._owner = owner;
        return ds;
    };
    PagerDataSource.prototype.pageViewControllerViewControllerBeforeViewController = function (pageViewController, viewControllerBefore) {
        var pos = viewControllerBefore.tag;
        if (pos === 0 || !this.owner || !this.owner.items) {
            return null;
        }
        else {
            var prev = pos - 1;
            return this.owner.getViewController(prev);
        }
    };
    PagerDataSource.prototype.pageViewControllerViewControllerAfterViewController = function (pageViewController, viewControllerAfter) {
        var pos = viewControllerAfter.tag;
        if (!this.owner || !this.owner.items) {
            return null;
        }
        else if (this.owner.items.length - 1 === pos) {
            this.owner.notify({
                eventName: pager_common_1.LOADMOREITEMS,
                object: this.owner
            });
            return null;
        }
        else {
            var newPos = pos + 1;
            return this.owner.getViewController(newPos);
        }
    };
    PagerDataSource.prototype.presentationCountForPageViewController = function (pageViewController) {
        if (!this.owner ||
            !this.owner.items ||
            !this.owner.showNativePageIndicator) {
            return -1;
        }
        return this.owner.items.length;
    };
    PagerDataSource.prototype.presentationIndexForPageViewController = function (pageViewController) {
        if (!this.owner || !this.owner.items) {
            return -1;
        }
        return this.owner.selectedIndex;
    };
    PagerDataSource.ObjCProtocols = [UIPageViewControllerDataSource];
    return PagerDataSource;
}(NSObject));
var PagerView = (function (_super) {
    __extends(PagerView, _super);
    function PagerView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PagerView.initWithOwnerTag = function (owner, tag) {
        var pv = new PagerView(null);
        pv.owner = owner;
        pv.tag = tag;
        return pv;
    };
    PagerView.prototype.didMoveToParentViewController = function (parent) {
        var owner = this.owner ? this.owner.get() : null;
        if (!parent && owner) {
        }
    };
    return PagerView;
}(UIViewController));
exports.PagerView = PagerView;
