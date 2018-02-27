"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("rxjs/add/operator/map");
var http_1 = require("@angular/common/http");
var core_1 = require("@angular/core");
var application_settings_1 = require("application-settings");
var BackendService = (function () {
    function BackendService(http) {
        this.http = http;
        this.Server = 'http://192.168.0.95:3000/';
        this.ApiUrl = 'app/api/wellness/';
        this.actionUrl = this.Server + this.ApiUrl;
        this.postOptions = {
            headers: new http_1.HttpHeaders().set('Content-Type', 'application/json')
        };
        // set Authorization header and content type for for requests. Ignore Authorization when in prod
        this.authHeaders = {
            headers: core_1.isDevMode() ? new http_1.HttpHeaders().set('Authorization', 'Basic dGVzdFVzZXI6cTF3MmUzcjQh')
                .set('Content-Type', 'application/json') :
                new http_1.HttpHeaders().set('Content-Type', 'application/json')
        };
    }
    // Methods
    BackendService.prototype.postActivity = function (myAct) {
        return this.http.post(this.actionUrl + 'apiUrl', JSON.stringify(myAct), this.authHeaders);
    };
    BackendService.prototype.getCategories = function () {
        return this.http.get('http://192.168.0.195:3000/app/api/wellness/activitiesRepository');
    };
    BackendService.prototype.getPoints = function (user, day) {
        return this.http.get(this.actionUrl + 'points/:' + user + '/:' + day);
    };
    BackendService.prototype.saveToken = function (token) {
        application_settings_1.setString('auth', token);
    };
    BackendService.prototype.getToken = function () {
        var myToken = application_settings_1.getString('auth');
        console.log(myToken);
    };
    BackendService.prototype.clearToken = function () {
        application_settings_1.clear();
    };
    BackendService = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [http_1.HttpClient])
    ], BackendService);
    return BackendService;
}());
exports.BackendService = BackendService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFja2VuZC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQStCO0FBRS9CLDZDQUF3STtBQUN4SSxzQ0FBc0Q7QUFHdEQsNkRBVThCO0FBSTlCO0lBZUksd0JBQW9CLElBQWdCO1FBQWhCLFNBQUksR0FBSixJQUFJLENBQVk7UUFkN0IsV0FBTSxHQUFHLDJCQUEyQixDQUFDO1FBQ3JDLFdBQU0sR0FBRyxtQkFBbUIsQ0FBQztRQUM3QixjQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRXJDLGdCQUFXLEdBQVE7WUFDdkIsT0FBTyxFQUFFLElBQUksa0JBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUM7U0FDckUsQ0FBQztRQUVGLGdHQUFnRztRQUN4RixnQkFBVyxHQUFRO1lBQ3ZCLE9BQU8sRUFBRSxnQkFBUyxFQUFFLEdBQUcsSUFBSSxrQkFBVyxFQUFFLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBQyxnQ0FBZ0MsQ0FBQztpQkFDekYsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQztnQkFDeEMsSUFBSSxrQkFBVyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQztTQUFDLENBQUM7SUFFN0IsQ0FBQztJQUl2QyxVQUFVO0lBRVYscUNBQVksR0FBWixVQUFhLEtBQWU7UUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRCxzQ0FBYSxHQUFiO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlFQUFpRSxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQUVELGtDQUFTLEdBQVQsVUFBVSxJQUFJLEVBQUUsR0FBRztRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBRSxDQUFDO0lBQzNFLENBQUM7SUFFRCxrQ0FBUyxHQUFULFVBQVUsS0FBSztRQUNYLGdDQUFTLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxpQ0FBUSxHQUFSO1FBQ0ksSUFBSSxPQUFPLEdBQUcsZ0NBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxtQ0FBVSxHQUFWO1FBQ0ksNEJBQUssRUFBRSxDQUFDO0lBQ1osQ0FBQztJQTVDUSxjQUFjO1FBRDFCLGlCQUFVLEVBQUU7eUNBZ0JpQixpQkFBVTtPQWYzQixjQUFjLENBOEMxQjtJQUFELHFCQUFDO0NBQUEsQUE5Q0QsSUE4Q0M7QUE5Q1ksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL21hcCc7XG5cbmltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBFdmVudCwgSHR0cEhhbmRsZXIsIEh0dHBJbnRlcmNlcHRvciwgSHR0cFJlcXVlc3QsIEh0dHBIZWFkZXJzLCBIdHRwRXJyb3JSZXNwb25zZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcbmltcG9ydCB7IEluamVjdGFibGUsIGlzRGV2TW9kZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvT2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBBY3Rpdml0eSB9IGZyb20gXCIuLi9fbW9kZWxzL2FjdGl2aXR5XCI7XG5pbXBvcnQge1xuICAgIGdldEJvb2xlYW4sXG4gICAgc2V0Qm9vbGVhbixcbiAgICBnZXROdW1iZXIsXG4gICAgc2V0TnVtYmVyLFxuICAgIGdldFN0cmluZyxcbiAgICBzZXRTdHJpbmcsXG4gICAgaGFzS2V5LFxuICAgIHJlbW92ZSxcbiAgICBjbGVhclxufSBmcm9tIFwiYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcblxuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQmFja2VuZFNlcnZpY2Uge1xuICAgIHB1YmxpYyBTZXJ2ZXIgPSAnaHR0cDovLzE5Mi4xNjguMC45NTozMDAwLyc7XG4gICAgcHVibGljIEFwaVVybCA9ICdhcHAvYXBpL3dlbGxuZXNzLyc7XG4gICAgcHVibGljIGFjdGlvblVybCA9IHRoaXMuU2VydmVyICsgdGhpcy5BcGlVcmw7XG5cbiAgICBwcml2YXRlIHBvc3RPcHRpb25zOiBhbnkgPSB7XG4gICAgICAgIGhlYWRlcnM6IG5ldyBIdHRwSGVhZGVycygpLnNldCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgIH07XG5cbiAgICAvLyBzZXQgQXV0aG9yaXphdGlvbiBoZWFkZXIgYW5kIGNvbnRlbnQgdHlwZSBmb3IgZm9yIHJlcXVlc3RzLiBJZ25vcmUgQXV0aG9yaXphdGlvbiB3aGVuIGluIHByb2RcbiAgICBwcml2YXRlIGF1dGhIZWFkZXJzOiBhbnkgPSB7XG4gICAgICAgIGhlYWRlcnM6IGlzRGV2TW9kZSgpID8gbmV3IEh0dHBIZWFkZXJzKCkuc2V0KCdBdXRob3JpemF0aW9uJywnQmFzaWMgZEdWemRGVnpaWEk2Y1RGM01tVXpjalFoJylcbiAgICAgICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJykgOlxuICAgICAgICAgICAgbmV3IEh0dHBIZWFkZXJzKCkuc2V0KCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpfTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cDogSHR0cENsaWVudCl7fVxuXG5cblxuICAgIC8vIE1ldGhvZHNcblxuICAgIHBvc3RBY3Rpdml0eShteUFjdDogQWN0aXZpdHkpe1xuICAgICAgICByZXR1cm4gdGhpcy5odHRwLnBvc3QodGhpcy5hY3Rpb25VcmwgKyAnYXBpVXJsJywgSlNPTi5zdHJpbmdpZnkobXlBY3QpLCB0aGlzLmF1dGhIZWFkZXJzKTtcbiAgICB9XG5cbiAgICBnZXRDYXRlZ29yaWVzKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAuZ2V0KCdodHRwOi8vMTkyLjE2OC4wLjE5NTozMDAwL2FwcC9hcGkvd2VsbG5lc3MvYWN0aXZpdGllc1JlcG9zaXRvcnknKTtcbiAgICB9XG5cbiAgICBnZXRQb2ludHModXNlciwgZGF5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cC5nZXQodGhpcy5hY3Rpb25VcmwgKyAncG9pbnRzLzonICsgdXNlciArICcvOicgKyBkYXkgKTtcbiAgICB9XG5cbiAgICBzYXZlVG9rZW4odG9rZW4pe1xuICAgICAgICBzZXRTdHJpbmcoJ2F1dGgnLCB0b2tlbik7XG4gICAgfVxuXG4gICAgZ2V0VG9rZW4oKXtcbiAgICAgICAgdmFyIG15VG9rZW4gPSBnZXRTdHJpbmcoJ2F1dGgnKTtcbiAgICAgICAgY29uc29sZS5sb2cobXlUb2tlbik7XG4gICAgfVxuXG4gICAgY2xlYXJUb2tlbigpe1xuICAgICAgICBjbGVhcigpO1xuICAgIH1cbiAgICBcbn0iXX0=