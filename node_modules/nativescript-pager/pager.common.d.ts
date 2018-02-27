import { View, Property, CoercibleProperty, KeyedTemplate, Template } from 'tns-core-modules/ui/core/view';
export declare const ITEMLOADING = "itemLoading";
export declare const LOADMOREITEMS = "loadMoreItems";
export declare namespace knownTemplates {
    const itemTemplate = "itemTemplate";
}
export declare namespace knownMultiTemplates {
    const itemTemplates = "itemTemplates";
}
export declare namespace knownCollections {
    const items = "items";
}
export declare const pagerTraceCategory = "ns-pager";
export declare function PagerLog(message: string): void;
export declare function PagerError(message: string): void;
export declare abstract class PagerBase extends View {
    disableCache: boolean;
    items: any;
    selectedIndex: number;
    showNativePageIndicator: boolean;
    itemTemplate: string | Template;
    itemTemplates: string | Array<KeyedTemplate>;
    private _pageSpacing;
    static selectedIndexChangedEvent: string;
    static selectedIndexChangeEvent: string;
    static knownFunctions: string[];
    abstract refresh(hardReset: boolean): void;
    private _itemTemplateSelector;
    private _itemTemplateSelectorBindable;
    _defaultTemplate: KeyedTemplate;
    _itemTemplatesInternal: KeyedTemplate[];
    itemTemplateSelector: string | ((item: any, index: number, items: any) => string);
    _getItemTemplate(index: number): KeyedTemplate;
    _prepareItem(item: View, index: number): void;
    private _getDataItem(index);
    _getDefaultItemContent(index: number): View;
    abstract disableSwipe: boolean;
    pageSpacing: number;
    abstract updateNativeItems(oldItems: Array<View>, newItems: Array<View>): void;
    abstract updateNativeIndex(oldIndex: number, newIndex: number): void;
    abstract itemTemplateUpdated(oldData: any, newData: any): void;
}
export declare const selectedIndexProperty: CoercibleProperty<PagerBase, number>;
export declare const itemsProperty: Property<PagerBase, any>;
export declare const showNativePageIndicatorProperty: Property<PagerBase, boolean>;
export declare const itemTemplateProperty: Property<PagerBase, string | Template>;
export declare const itemTemplatesProperty: Property<PagerBase, string | KeyedTemplate[]>;
