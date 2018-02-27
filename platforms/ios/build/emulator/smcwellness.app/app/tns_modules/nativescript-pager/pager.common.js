"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var view_1 = require("tns-core-modules/ui/core/view");
var platform_1 = require("tns-core-modules/platform");
var types = require("tns-core-modules/utils/types");
var builder_1 = require("tns-core-modules/ui/builder");
var label_1 = require("tns-core-modules/ui/label/label");
var trace_1 = require("tns-core-modules/trace");
exports.ITEMLOADING = 'itemLoading';
exports.LOADMOREITEMS = 'loadMoreItems';
var knownTemplates;
(function (knownTemplates) {
    knownTemplates.itemTemplate = 'itemTemplate';
})(knownTemplates = exports.knownTemplates || (exports.knownTemplates = {}));
var knownMultiTemplates;
(function (knownMultiTemplates) {
    knownMultiTemplates.itemTemplates = 'itemTemplates';
})(knownMultiTemplates = exports.knownMultiTemplates || (exports.knownMultiTemplates = {}));
var knownCollections;
(function (knownCollections) {
    knownCollections.items = 'items';
})(knownCollections = exports.knownCollections || (exports.knownCollections = {}));
exports.pagerTraceCategory = 'ns-pager';
function PagerLog(message) {
    trace_1.write(message, exports.pagerTraceCategory);
}
exports.PagerLog = PagerLog;
function PagerError(message) {
    trace_1.write(message, exports.pagerTraceCategory, trace_1.messageType.error);
}
exports.PagerError = PagerError;
var PagerBase = (function (_super) {
    __extends(PagerBase, _super);
    function PagerBase() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._pageSpacing = 0;
        _this._itemTemplateSelectorBindable = new label_1.Label();
        _this._defaultTemplate = {
            key: 'default',
            createView: function () {
                if (_this.itemTemplate) {
                    return builder_1.parse(_this.itemTemplate, _this);
                }
                return undefined;
            }
        };
        _this._itemTemplatesInternal = new Array(_this._defaultTemplate);
        return _this;
    }
    Object.defineProperty(PagerBase.prototype, "itemTemplateSelector", {
        get: function () {
            return this._itemTemplateSelector;
        },
        set: function (value) {
            var _this = this;
            if (typeof value === 'string') {
                this._itemTemplateSelectorBindable.bind({
                    sourceProperty: null,
                    targetProperty: 'templateKey',
                    expression: value
                });
                this._itemTemplateSelector = function (item, index, items) {
                    item['$index'] = index;
                    _this._itemTemplateSelectorBindable.bindingContext = item;
                    return _this._itemTemplateSelectorBindable.get('templateKey');
                };
            }
            else if (typeof value === 'function') {
                this._itemTemplateSelector = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    PagerBase.prototype._getItemTemplate = function (index) {
        var templateKey = 'default';
        if (this.itemTemplateSelector) {
            var dataItem = this._getDataItem(index);
            templateKey = this._itemTemplateSelector(dataItem, index, this.items);
        }
        for (var i = 0, length_1 = this._itemTemplatesInternal.length; i < length_1; i++) {
            if (this._itemTemplatesInternal[i].key === templateKey) {
                return this._itemTemplatesInternal[i];
            }
        }
        return this._itemTemplatesInternal[0];
    };
    PagerBase.prototype._prepareItem = function (item, index) {
        if (item) {
            item.bindingContext = this._getDataItem(index);
        }
    };
    PagerBase.prototype._getDataItem = function (index) {
        var thisItems = this.items;
        return thisItems.getItem ? thisItems.getItem(index) : thisItems[index];
    };
    PagerBase.prototype._getDefaultItemContent = function (index) {
        var lbl = new label_1.Label();
        lbl.bind({
            targetProperty: 'text',
            sourceProperty: '$value'
        });
        return lbl;
    };
    Object.defineProperty(PagerBase.prototype, "pageSpacing", {
        get: function () {
            return this._pageSpacing;
        },
        set: function (value) {
            this._pageSpacing = value;
        },
        enumerable: true,
        configurable: true
    });
    PagerBase.selectedIndexChangedEvent = 'selectedIndexChanged';
    PagerBase.selectedIndexChangeEvent = 'selectedIndexChange';
    PagerBase.knownFunctions = ['itemTemplateSelector'];
    return PagerBase;
}(view_1.View));
exports.PagerBase = PagerBase;
function onItemsChanged(pager, oldValue, newValue) {
    if (newValue) {
        pager.updateNativeItems(oldValue, newValue);
    }
}
function onItemTemplateChanged(pager, oldValue, newValue) {
    pager.itemTemplateUpdated(oldValue, newValue);
}
function onSelectedIndexChanged(pager, oldValue, newValue) {
    if (pager && pager.items && types.isNumber(newValue)) {
        pager.updateNativeIndex(oldValue, newValue);
    }
}
exports.selectedIndexProperty = new view_1.CoercibleProperty({
    name: 'selectedIndex',
    defaultValue: -1,
    valueChanged: onSelectedIndexChanged,
    affectsLayout: platform_1.isIOS,
    coerceValue: function (target, value) {
        var items = target.items;
        if (items) {
            var max = items.length - 1;
            if (value < 0) {
                value = 0;
            }
            if (value > max) {
                value = max;
            }
        }
        else {
            value = -1;
        }
        return value;
    },
    valueConverter: function (v) { return parseInt(v, 10); }
});
exports.selectedIndexProperty.register(PagerBase);
exports.itemsProperty = new view_1.Property({
    name: 'items',
    affectsLayout: true,
    valueChanged: onItemsChanged
});
exports.itemsProperty.register(PagerBase);
exports.showNativePageIndicatorProperty = new view_1.Property({
    name: 'showNativePageIndicator',
    defaultValue: false,
    valueConverter: view_1.booleanConverter
});
exports.showNativePageIndicatorProperty.register(PagerBase);
exports.itemTemplateProperty = new view_1.Property({
    name: 'itemTemplate',
    affectsLayout: true,
    valueChanged: function (target) {
        target.refresh(true);
    }
});
exports.itemTemplateProperty.register(PagerBase);
exports.itemTemplatesProperty = new view_1.Property({
    name: 'itemTemplates',
    affectsLayout: true,
    valueConverter: function (value) {
        if (typeof value === 'string') {
            return builder_1.parseMultipleTemplates(value);
        }
        return value;
    }
});
exports.itemTemplatesProperty.register(PagerBase);
