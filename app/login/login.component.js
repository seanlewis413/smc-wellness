"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("tns-core-modules/ui/page/page");
var index_service_1 = require("../_services/index.service");
var router_1 = require("@angular/router");
var LoginComponent = (function () {
    function LoginComponent(api, page, route, router, savedData) {
        this.api = api;
        this.page = page;
        this.route = route;
        this.router = router;
        this.savedData = savedData;
        this.user = '';
        this.password = '';
        this.users = [
            { userName: 'Sean', password: 'smc' },
            { userName: 'smc', password: 'test' },
            { userName: '', password: '' },
            { userName: 'Usamah', password: '' }
        ];
    }
    LoginComponent.prototype.signIn = function () {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].userName == this.user && this.users[i].password == this.password) {
                console.log(this.user + " successfully logging in with password " + this.password);
                this.savedData.saveUser(this.user);
                this.savedData.saveSignIn();
                this.router.navigate(['/main']);
                break;
            }
            else {
                console.log(this.user + " user not found...");
            }
            ;
        }
        ;
    };
    ;
    LoginComponent = __decorate([
        core_1.Component({
            selector: "my-app",
            moduleId: module.id,
            templateUrl: "./login.component.html",
            styleUrls: ["login.component.css", "../app.css"],
            providers: [index_service_1.BackendService, index_service_1.StateService]
        }),
        __metadata("design:paramtypes", [index_service_1.BackendService,
            page_1.Page,
            router_1.ActivatedRoute,
            router_1.Router,
            index_service_1.StateService])
    ], LoginComponent);
    return LoginComponent;
}());
exports.LoginComponent = LoginComponent;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4uY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9naW4uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQXFFO0FBRXJFLHNEQUFxRDtBQUdyRCw0REFBMEU7QUFHMUUsMENBQXlEO0FBVXpEO0lBWUksd0JBQ1ksR0FBbUIsRUFDbkIsSUFBVSxFQUNWLEtBQXFCLEVBQ3JCLE1BQWMsRUFDZCxTQUF1QjtRQUp2QixRQUFHLEdBQUgsR0FBRyxDQUFnQjtRQUNuQixTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ1YsVUFBSyxHQUFMLEtBQUssQ0FBZ0I7UUFDckIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLGNBQVMsR0FBVCxTQUFTLENBQWM7UUFmbkMsU0FBSSxHQUFXLEVBQUUsQ0FBQztRQUNsQixhQUFRLEdBQVcsRUFBRSxDQUFDO1FBRXRCLFVBQUssR0FBQztZQUNGLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFO1lBQ3BDLEVBQUMsUUFBUSxFQUFFLEtBQUssRUFBRyxRQUFRLEVBQUUsTUFBTSxFQUFDO1lBQ3BDLEVBQUMsUUFBUSxFQUFFLEVBQUUsRUFBTSxRQUFRLEVBQU0sRUFBRSxFQUFDO1lBQ3BDLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFDO1NBQ3JDLENBQUE7SUFPb0MsQ0FBQztJQUV0QywrQkFBTSxHQUFOO1FBQ0ksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBQyxDQUFDO1lBQ3hDLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUM7Z0JBQy9FLE9BQU8sQ0FBQyxHQUFHLENBQUksSUFBSSxDQUFDLElBQUksK0NBQTBDLElBQUksQ0FBQyxRQUFVLENBQUMsQ0FBQztnQkFFbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUU1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLEtBQUssQ0FBQztZQUNWLENBQUM7WUFBQSxJQUFJLENBQUEsQ0FBQztnQkFDRixPQUFPLENBQUMsR0FBRyxDQUFJLElBQUksQ0FBQyxJQUFJLHVCQUFvQixDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUFBLENBQUM7UUFDTixDQUFDO1FBQUEsQ0FBQztJQUVOLENBQUM7SUFBQSxDQUFDO0lBbENPLGNBQWM7UUFSMUIsZ0JBQVMsQ0FBQztZQUNQLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixXQUFXLEVBQUUsd0JBQXdCO1lBQ3JDLFNBQVMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLFlBQVksQ0FBQztZQUNoRCxTQUFTLEVBQUMsQ0FBQyw4QkFBYyxFQUFFLDRCQUFZLENBQUM7U0FDekMsQ0FBQzt5Q0FlaUIsOEJBQWM7WUFDYixXQUFJO1lBQ0gsdUJBQWM7WUFDYixlQUFNO1lBQ0gsNEJBQVk7T0FqQjFCLGNBQWMsQ0FtQzFCO0lBQUQscUJBQUM7Q0FBQSxBQW5DRCxJQW1DQztBQW5DWSx3Q0FBYztBQW1DMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0LCBJbmplY3RhYmxlLCBJbnB1dCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBOYXRpdmVTY3JpcHRGb3Jtc01vZHVsZSB9IGZyb20gXCJuYXRpdmVzY3JpcHQtYW5ndWxhci9mb3Jtc1wiO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvdWkvcGFnZS9wYWdlJztcbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBGcmFtZSB9IGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvdWkvZnJhbWUvZnJhbWUnO1xuaW1wb3J0IHsgQmFja2VuZFNlcnZpY2UsIFN0YXRlU2VydmljZSB9IGZyb20gJy4uL19zZXJ2aWNlcy9pbmRleC5zZXJ2aWNlJztcbmltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBFdmVudCwgSHR0cEhhbmRsZXIsIEh0dHBJbnRlcmNlcHRvciwgSHR0cFJlcXVlc3QsIEh0dHBIZWFkZXJzLCBIdHRwRXJyb3JSZXNwb25zZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEdlc3R1cmVFdmVudERhdGEgfSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9nZXN0dXJlcy9nZXN0dXJlc1wiO1xuaW1wb3J0IHsgUm91dGVyLCBBY3RpdmF0ZWRSb3V0ZSB9IGZyb20gXCJAYW5ndWxhci9yb3V0ZXJcIjtcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6IFwibXktYXBwXCIsXG4gICAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgICB0ZW1wbGF0ZVVybDogXCIuL2xvZ2luLmNvbXBvbmVudC5odG1sXCIsICAgICAgICAgICAgICAgICBcbiAgICBzdHlsZVVybHM6IFtcImxvZ2luLmNvbXBvbmVudC5jc3NcIiwgXCIuLi9hcHAuY3NzXCJdLFxuICAgIHByb3ZpZGVyczpbQmFja2VuZFNlcnZpY2UsIFN0YXRlU2VydmljZV1cbiAgfSlcblxuZXhwb3J0IGNsYXNzIExvZ2luQ29tcG9uZW50e1xuXG4gICAgdXNlcjogc3RyaW5nID0gJyc7XG4gICAgcGFzc3dvcmQ6IHN0cmluZyA9ICcnO1xuXG4gICAgdXNlcnM9W1xuICAgICAgICB7dXNlck5hbWU6ICdTZWFuJywgcGFzc3dvcmQ6ICdzbWMnIH0sXG4gICAgICAgIHt1c2VyTmFtZTogJ3NtYycsICBwYXNzd29yZDogJ3Rlc3QnfSxcbiAgICAgICAge3VzZXJOYW1lOiAnJywgICAgIHBhc3N3b3JkOiAgICAgJyd9LFxuICAgICAgICB7dXNlck5hbWU6ICdVc2FtYWgnLCBwYXNzd29yZDogJyd9XG4gICAgXVxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgYXBpOiBCYWNrZW5kU2VydmljZSxcbiAgICAgICAgcHJpdmF0ZSBwYWdlOiBQYWdlLFxuICAgICAgICBwcml2YXRlIHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZSxcbiAgICAgICAgcHJpdmF0ZSByb3V0ZXI6IFJvdXRlcixcbiAgICAgICAgcHJpdmF0ZSBzYXZlZERhdGE6IFN0YXRlU2VydmljZSl7fVxuXG4gICAgc2lnbkluKCl7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy51c2Vycy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLnVzZXJzW2ldLnVzZXJOYW1lID09IHRoaXMudXNlciAmJiB0aGlzLnVzZXJzW2ldLnBhc3N3b3JkID09IHRoaXMucGFzc3dvcmQpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMudXNlcn0gc3VjY2Vzc2Z1bGx5IGxvZ2dpbmcgaW4gd2l0aCBwYXNzd29yZCAke3RoaXMucGFzc3dvcmR9YCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVkRGF0YS5zYXZlVXNlcih0aGlzLnVzZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZWREYXRhLnNhdmVTaWduSW4oKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucm91dGVyLm5hdmlnYXRlKFsnL21haW4nXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHt0aGlzLnVzZXJ9IHVzZXIgbm90IGZvdW5kLi4uYCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICB9O1xufTsiXX0=