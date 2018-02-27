import { View } from 'tns-core-modules/ui/core/view';
import { PagerBase } from './pager.common';
export declare class Pager extends PagerBase {
    private _disableSwipe;
    itemTemplateUpdated(oldData: any, newData: any): void;
    private _orientation;
    private _options;
    private _transformer;
    _ios: UIPageViewController;
    private widthMeasureSpec;
    private heightMeasureSpec;
    private layoutWidth;
    private layoutHeight;
    private _viewMap;
    private cachedViewControllers;
    private delegate;
    private dataSource;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: any;
    private _isDataDirty;
    constructor();
    readonly transformer: any;
    eachChildView(callback: (child: View) => boolean): void;
    updateNativeIndex(oldIndex: number, newIndex: number): void;
    updateNativeItems(oldItems: View[], newItems: View[]): void;
    refresh(hardReset?: boolean): void;
    getViewController(selectedIndex: number, refresh?: boolean): UIViewController;
    onLoaded(): void;
    disableSwipe: boolean;
    onUnloaded(): void;
    disposeNativeView(): void;
    private prepareView(view);
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    onLayout(left: number, top: number, right: number, bottom: number): void;
    private _clearCachedItems();
    _viewControllerRemovedFromParent(controller: PagerView): void;
    private _initNativeViewPager();
    private _navigateNativeViewPagerToIndex(fromIndex, toIndex);
}
export declare class PagerView extends UIViewController {
    owner: WeakRef<Pager>;
    tag: number;
    static initWithOwnerTag(owner: WeakRef<Pager>, tag: number): PagerView;
    didMoveToParentViewController(parent: UIViewController): void;
}
