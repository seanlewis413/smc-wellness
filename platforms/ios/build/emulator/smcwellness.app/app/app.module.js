"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var forms_1 = require("nativescript-angular/forms");
var nativescript_module_1 = require("nativescript-angular/nativescript.module");
var router_1 = require("nativescript-angular/router");
var app_routes_1 = require("./app.routes");
var entrypage_component_1 = require("./entrypage/entrypage.component");
var http_1 = require("@angular/common/http");
var angular_1 = require("nativescript-pager/angular");
var login_component_1 = require("./login/login.component");
var router_2 = require("@angular/router");
var index_service_1 = require("./_services/index.service");
var NavigationAppComponent = (function () {
    function NavigationAppComponent(api, savedData, route, router) {
        this.api = api;
        this.savedData = savedData;
        this.route = route;
        this.router = router;
    }
    NavigationAppComponent.prototype.ngOnInit = function () {
        this.isSignedIn = this.savedData.getSignIn();
        if (this.isSignedIn) {
            this.router.navigate(['/main']);
        }
        else {
            this.router.navigate(['/login']);
        }
    };
    NavigationAppComponent = __decorate([
        core_1.Component({
            selector: "navigation-test",
            template: "\n      <StackLayout>\n          <router-outlet></router-outlet>\n      </StackLayout>\n  ",
            styleUrls: ["./login/login.component.css", "./entrypage/entrypage.component.css", "./app.css"],
            providers: [index_service_1.BackendService, index_service_1.StateService]
        }),
        __metadata("design:paramtypes", [index_service_1.BackendService,
            index_service_1.StateService,
            router_2.ActivatedRoute,
            router_2.Router])
    ], NavigationAppComponent);
    return NavigationAppComponent;
}());
exports.NavigationAppComponent = NavigationAppComponent;
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        core_1.NgModule({
            declarations: [entrypage_component_1.EntryPageComponent, NavigationAppComponent, login_component_1.LoginComponent],
            bootstrap: [NavigationAppComponent],
            imports: [nativescript_module_1.NativeScriptModule, http_1.HttpClientModule, angular_1.PagerModule, router_1.NativeScriptRouterModule, router_1.NativeScriptRouterModule.forRoot(app_routes_1.routes), forms_1.NativeScriptFormsModule],
            schemas: [core_1.NO_ERRORS_SCHEMA],
            providers: [index_service_1.BackendService, index_service_1.StateService]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBOEU7QUFDOUUsb0RBQXFFO0FBQ3JFLGdGQUE4RTtBQUM5RSxzREFBc0U7QUFDdEUsMkNBQXNDO0FBQ3RDLHVFQUFxRTtBQUNyRSw2Q0FBd0Q7QUFDeEQsc0RBQXlEO0FBQ3pELDJEQUF5RDtBQUN6RCwwQ0FBeUQ7QUFDekQsMkRBQXlFO0FBWXpFO0lBSUUsZ0NBQ1UsR0FBbUIsRUFDbkIsU0FBdUIsRUFDdkIsS0FBcUIsRUFDckIsTUFBYztRQUhkLFFBQUcsR0FBSCxHQUFHLENBQWdCO1FBQ25CLGNBQVMsR0FBVCxTQUFTLENBQWM7UUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBZ0I7UUFDckIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtJQUFFLENBQUM7SUFFM0IseUNBQVEsR0FBUjtRQUVFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUM3QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUEsQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDSCxDQUFDO0lBbEJVLHNCQUFzQjtRQVZsQyxnQkFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixRQUFRLEVBQUUsNEZBSVQ7WUFDRCxTQUFTLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxxQ0FBcUMsRUFBRSxXQUFXLENBQUM7WUFDOUYsU0FBUyxFQUFDLENBQUMsOEJBQWMsRUFBRSw0QkFBWSxDQUFDO1NBQ3pDLENBQUM7eUNBTWUsOEJBQWM7WUFDUiw0QkFBWTtZQUNoQix1QkFBYztZQUNiLGVBQU07T0FSYixzQkFBc0IsQ0FtQmxDO0lBQUQsNkJBQUM7Q0FBQSxBQW5CRCxJQW1CQztBQW5CWSx3REFBc0I7QUE2Qm5DO0lBQUE7SUFBd0IsQ0FBQztJQUFaLFNBQVM7UUFQckIsZUFBUSxDQUFDO1lBQ1IsWUFBWSxFQUFFLENBQUMsd0NBQWtCLEVBQUUsc0JBQXNCLEVBQUUsZ0NBQWMsQ0FBQztZQUMxRSxTQUFTLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztZQUNuQyxPQUFPLEVBQUUsQ0FBQyx3Q0FBa0IsRUFBRSx1QkFBZ0IsRUFBRSxxQkFBVyxFQUFFLGlDQUF3QixFQUFFLGlDQUF3QixDQUFDLE9BQU8sQ0FBQyxtQkFBTSxDQUFDLEVBQUUsK0JBQXVCLENBQUM7WUFDekosT0FBTyxFQUFFLENBQUMsdUJBQWdCLENBQUM7WUFDM0IsU0FBUyxFQUFFLENBQUMsOEJBQWMsRUFBRSw0QkFBWSxDQUFDO1NBQzFDLENBQUM7T0FDVyxTQUFTLENBQUc7SUFBRCxnQkFBQztDQUFBLEFBQXpCLElBQXlCO0FBQVosOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSwgTk9fRVJST1JTX1NDSEVNQSwgQ29tcG9uZW50LCBPbkluaXQgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgTmF0aXZlU2NyaXB0Rm9ybXNNb2R1bGUgfSBmcm9tIFwibmF0aXZlc2NyaXB0LWFuZ3VsYXIvZm9ybXNcIjtcbmltcG9ydCB7IE5hdGl2ZVNjcmlwdE1vZHVsZSB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9uYXRpdmVzY3JpcHQubW9kdWxlXCI7XG5pbXBvcnQgeyBOYXRpdmVTY3JpcHRSb3V0ZXJNb2R1bGV9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9yb3V0ZXJcIjtcbmltcG9ydCB7IHJvdXRlcyB9IGZyb20gJy4vYXBwLnJvdXRlcyc7XG5pbXBvcnQgeyBFbnRyeVBhZ2VDb21wb25lbnQgfSBmcm9tIFwiLi9lbnRyeXBhZ2UvZW50cnlwYWdlLmNvbXBvbmVudFwiO1xuaW1wb3J0IHsgSHR0cENsaWVudE1vZHVsZSB9IGZyb20gXCJAYW5ndWxhci9jb21tb24vaHR0cFwiO1xuaW1wb3J0IHsgUGFnZXJNb2R1bGUgfSBmcm9tIFwibmF0aXZlc2NyaXB0LXBhZ2VyL2FuZ3VsYXJcIjtcbmltcG9ydCB7IExvZ2luQ29tcG9uZW50IH0gZnJvbSBcIi4vbG9naW4vbG9naW4uY29tcG9uZW50XCI7XG5pbXBvcnQgeyBSb3V0ZXIsIEFjdGl2YXRlZFJvdXRlIH0gZnJvbSBcIkBhbmd1bGFyL3JvdXRlclwiO1xuaW1wb3J0IHsgU3RhdGVTZXJ2aWNlLCBCYWNrZW5kU2VydmljZSB9IGZyb20gXCIuL19zZXJ2aWNlcy9pbmRleC5zZXJ2aWNlXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJuYXZpZ2F0aW9uLXRlc3RcIixcbiAgdGVtcGxhdGU6IGBcbiAgICAgIDxTdGFja0xheW91dD5cbiAgICAgICAgICA8cm91dGVyLW91dGxldD48L3JvdXRlci1vdXRsZXQ+XG4gICAgICA8L1N0YWNrTGF5b3V0PlxuICBgLFxuICBzdHlsZVVybHM6IFtcIi4vbG9naW4vbG9naW4uY29tcG9uZW50LmNzc1wiLCBcIi4vZW50cnlwYWdlL2VudHJ5cGFnZS5jb21wb25lbnQuY3NzXCIsIFwiLi9hcHAuY3NzXCJdLFxuICBwcm92aWRlcnM6W0JhY2tlbmRTZXJ2aWNlLCBTdGF0ZVNlcnZpY2VdICBcbn0pXG5leHBvcnQgY2xhc3MgTmF2aWdhdGlvbkFwcENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdHtcblxuICBpc1NpZ25lZEluOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgYXBpOiBCYWNrZW5kU2VydmljZSxcbiAgICBwcml2YXRlIHNhdmVkRGF0YTogU3RhdGVTZXJ2aWNlLFxuICAgIHByaXZhdGUgcm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgIHByaXZhdGUgcm91dGVyOiBSb3V0ZXIpe31cblxuICBuZ09uSW5pdCgpe1xuXG4gICAgdGhpcy5pc1NpZ25lZEluID0gdGhpcy5zYXZlZERhdGEuZ2V0U2lnbkluKCk7XG4gICAgaWYgKHRoaXMuaXNTaWduZWRJbil7XG4gICAgICB0aGlzLnJvdXRlci5uYXZpZ2F0ZShbJy9tYWluJ10pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvdXRlci5uYXZpZ2F0ZShbJy9sb2dpbiddKTtcbiAgICB9XG4gIH1cbn1cblxuXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFtFbnRyeVBhZ2VDb21wb25lbnQsIE5hdmlnYXRpb25BcHBDb21wb25lbnQsIExvZ2luQ29tcG9uZW50XSxcbiAgYm9vdHN0cmFwOiBbTmF2aWdhdGlvbkFwcENvbXBvbmVudF0sXG4gIGltcG9ydHM6IFtOYXRpdmVTY3JpcHRNb2R1bGUsIEh0dHBDbGllbnRNb2R1bGUsIFBhZ2VyTW9kdWxlLCBOYXRpdmVTY3JpcHRSb3V0ZXJNb2R1bGUsIE5hdGl2ZVNjcmlwdFJvdXRlck1vZHVsZS5mb3JSb290KHJvdXRlcyksIE5hdGl2ZVNjcmlwdEZvcm1zTW9kdWxlXSxcbiAgc2NoZW1hczogW05PX0VSUk9SU19TQ0hFTUFdLFxuICBwcm92aWRlcnM6IFtCYWNrZW5kU2VydmljZSwgU3RhdGVTZXJ2aWNlXVxufSlcbmV4cG9ydCBjbGFzcyBBcHBNb2R1bGUge31cbiJdfQ==