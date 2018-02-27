"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var element_registry_1 = require("nativescript-angular/element-registry");
var lang_facade_1 = require("nativescript-angular/lang-facade");
var observable_array_1 = require("tns-core-modules/data/observable-array");
var profiling_1 = require("tns-core-modules/profiling");
var layout_base_1 = require("tns-core-modules/ui/layouts/layout-base");
var pager_common_1 = require("../pager.common");
var NG_VIEW = '_ngViewRef';
element_registry_1.registerElement('Pager', function () { return require('../').Pager; });
function getItemViewRoot(viewRef, rootLocator) {
    if (rootLocator === void 0) { rootLocator = element_registry_1.getSingleViewRecursive; }
    return rootLocator(viewRef.rootNodes, 0);
}
exports.getItemViewRoot = getItemViewRoot;
var PagerItemContext = (function () {
    function PagerItemContext($implicit, item, index, even, odd) {
        this.$implicit = $implicit;
        this.item = item;
        this.index = index;
        this.even = even;
        this.odd = odd;
    }
    return PagerItemContext;
}());
exports.PagerItemContext = PagerItemContext;
var PagerComponent = (function () {
    function PagerComponent(el, _iterableDiffers) {
        this._iterableDiffers = _iterableDiffers;
        this.setupItemView = new core_1.EventEmitter();
        this.pager = el.nativeElement;
        this.pager.on(pager_common_1.ITEMLOADING, this.onItemLoading, this);
    }
    Object.defineProperty(PagerComponent.prototype, "selectedIndex", {
        get: function () {
            return this._selectedIndex;
        },
        set: function (value) {
            this._selectedIndex = value;
            if (this.viewInitialized) {
                this.pager.selectedIndex = this._selectedIndex;
            }
        },
        enumerable: true,
        configurable: true
    });
    PagerComponent.prototype.ngAfterViewInit = function () {
        this.viewInitialized = true;
        if (!lang_facade_1.isBlank(this._selectedIndex)) {
            this.pager.selectedIndex = this._selectedIndex;
        }
    };
    Object.defineProperty(PagerComponent.prototype, "nativeElement", {
        get: function () {
            return this.pager;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PagerComponent.prototype, "items", {
        get: function () {
            return this._items;
        },
        set: function (value) {
            this._items = value;
            var needDiffer = true;
            if (value instanceof observable_array_1.ObservableArray) {
                needDiffer = false;
            }
            if (needDiffer && !this._differ && core_1.ɵisListLikeIterable(value)) {
                this._differ = this._iterableDiffers
                    .find(this._items)
                    .create(function (_index, item) {
                    return item;
                });
            }
            this.setItemTemplates();
            this.pager.items = this._items;
        },
        enumerable: true,
        configurable: true
    });
    PagerComponent.prototype.setItemTemplates = function () {
        this.itemTemplate = this.itemTemplateQuery;
        if (this._templateMap) {
            var templates_1 = [];
            this._templateMap.forEach(function (value) {
                templates_1.push(value);
            });
            this.pager.itemTemplates = templates_1;
        }
    };
    PagerComponent.prototype.registerTemplate = function (key, template) {
        var _this = this;
        if (!this._templateMap) {
            this._templateMap = new Map();
        }
        var keyedTemplate = {
            key: key,
            createView: function () {
                var viewRef = _this.loader.createEmbeddedView(template, new PagerItemContext(), 0);
                var resultView = getItemViewRoot(viewRef);
                resultView[NG_VIEW] = viewRef;
                return resultView;
            }
        };
        this._templateMap.set(key, keyedTemplate);
    };
    PagerComponent.prototype.ngOnDestroy = function () {
        this.pager.off(pager_common_1.ITEMLOADING, this.onItemLoading, this);
    };
    PagerComponent.prototype.onItemLoading = function (args) {
        if (!args.view && !this.itemTemplate) {
            return;
        }
        var index = args.index;
        var items = args.object.items;
        var currentItem = typeof items.getItem === 'function' ? items.getItem(index) : items[index];
        var viewRef;
        if (args.view) {
            viewRef = args.view[NG_VIEW];
            if (!viewRef &&
                args.view instanceof layout_base_1.LayoutBase &&
                args.view.getChildrenCount() > 0) {
                viewRef = args.view.getChildAt(0)[NG_VIEW];
            }
            if (!viewRef) {
                pager_common_1.PagerError('ViewReference not found for item ' +
                    index +
                    '. View recycling is not working');
            }
        }
        if (!viewRef) {
            pager_common_1.PagerLog('onItemLoading: ' + index + ' - Creating view from template');
            viewRef = this.loader.createEmbeddedView(this.itemTemplate, new PagerItemContext(), 0);
            args.view = getItemViewRoot(viewRef);
            args.view[NG_VIEW] = viewRef;
        }
        this.setupViewRef(viewRef, currentItem, index);
        this.detectChangesOnChild(viewRef, index);
    };
    PagerComponent.prototype.setupViewRef = function (viewRef, data, index) {
        var context = viewRef.context;
        context.$implicit = data;
        context.item = data;
        context.index = index;
        context.even = index % 2 === 0;
        context.odd = !context.even;
        this.setupItemView.next({
            view: viewRef,
            data: data,
            index: index,
            context: context
        });
    };
    PagerComponent.prototype.detectChangesOnChild = function (viewRef, index) {
        pager_common_1.PagerLog('Manually detect changes in child: ' + index);
        viewRef.markForCheck();
        viewRef.detectChanges();
    };
    PagerComponent.prototype.ngDoCheck = function () {
        if (this._differ) {
            pager_common_1.PagerLog('ngDoCheck() - execute differ');
            var changes = this._differ.diff(this._items);
            if (changes) {
                pager_common_1.PagerLog('ngDoCheck() - refresh');
                this.pager.refresh(false);
            }
        }
    };
    PagerComponent.decorators = [
        { type: core_1.Component, args: [{
                    selector: 'Pager',
                    template: "\n        <DetachedContainer>\n            <Placeholder #loader></Placeholder>\n        </DetachedContainer>",
                    changeDetection: core_1.ChangeDetectionStrategy.OnPush
                },] },
    ];
    PagerComponent.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: core_1.IterableDiffers, },
    ]; };
    PagerComponent.propDecorators = {
        "loader": [{ type: core_1.ViewChild, args: ['loader', { read: core_1.ViewContainerRef },] },],
        "setupItemView": [{ type: core_1.Output },],
        "itemTemplateQuery": [{ type: core_1.ContentChild, args: [core_1.TemplateRef,] },],
        "selectedIndex": [{ type: core_1.Input },],
        "items": [{ type: core_1.Input },],
    };
    __decorate([
        profiling_1.profile,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], PagerComponent.prototype, "onItemLoading", null);
    __decorate([
        profiling_1.profile,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [core_1.EmbeddedViewRef, Number]),
        __metadata("design:returntype", void 0)
    ], PagerComponent.prototype, "detectChangesOnChild", null);
    return PagerComponent;
}());
exports.PagerComponent = PagerComponent;
var TemplateKeyDirective = (function () {
    function TemplateKeyDirective(templateRef, pager) {
        this.templateRef = templateRef;
        this.pager = pager;
    }
    Object.defineProperty(TemplateKeyDirective.prototype, "pagerTemplateKey", {
        set: function (value) {
            if (this.pager && this.templateRef) {
                this.pager.registerTemplate(value, this.templateRef);
            }
        },
        enumerable: true,
        configurable: true
    });
    TemplateKeyDirective.decorators = [
        { type: core_1.Directive, args: [{ selector: '[pagerTemplateKey]' },] },
    ];
    TemplateKeyDirective.ctorParameters = function () { return [
        { type: core_1.TemplateRef, },
        { type: PagerComponent, decorators: [{ type: core_1.Host },] },
    ]; };
    TemplateKeyDirective.propDecorators = {
        "pagerTemplateKey": [{ type: core_1.Input },],
    };
    return TemplateKeyDirective;
}());
exports.TemplateKeyDirective = TemplateKeyDirective;
var PagerModule = (function () {
    function PagerModule() {
    }
    PagerModule.decorators = [
        { type: core_1.NgModule, args: [{
                    declarations: [PagerComponent, TemplateKeyDirective],
                    exports: [PagerComponent, TemplateKeyDirective],
                    schemas: [core_1.NO_ERRORS_SCHEMA]
                },] },
    ];
    PagerModule.ctorParameters = function () { return []; };
    return PagerModule;
}());
exports.PagerModule = PagerModule;
