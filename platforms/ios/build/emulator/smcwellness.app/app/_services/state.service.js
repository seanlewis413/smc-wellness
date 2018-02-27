"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("rxjs/add/operator/map");
var core_1 = require("@angular/core");
var application_settings_1 = require("application-settings");
var StateService = (function () {
    function StateService() {
    }
    StateService.prototype.saveUser = function (user) {
        console.log("saving user " + user);
        application_settings_1.setString('user', user);
    };
    StateService.prototype.saveSignIn = function () {
        console.log('setting signed in value...');
        application_settings_1.setBoolean('isSignedIn', true);
    };
    StateService.prototype.getSignIn = function () {
        console.log("getting sign in status.....");
        return application_settings_1.getBoolean('isSignedIn');
    };
    StateService.prototype.clearAll = function () {
        console.log('clearing values...');
        application_settings_1.clear();
    };
    StateService.prototype.getUser = function () {
        var myUser = application_settings_1.getString('user');
        return myUser;
    };
    StateService = __decorate([
        core_1.Injectable(),
        __metadata("design:paramtypes", [])
    ], StateService);
    return StateService;
}());
exports.StateService = StateService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0YXRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBK0I7QUFHL0Isc0NBQXNEO0FBR3RELDZEQVU4QjtBQUk5QjtJQUNJO0lBQWMsQ0FBQztJQUVmLCtCQUFRLEdBQVIsVUFBUyxJQUFJO1FBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDbkMsZ0NBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGlDQUFVLEdBQVY7UUFDSSxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDMUMsaUNBQVUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELGdDQUFTLEdBQVQ7UUFDSSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLGlDQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELCtCQUFRLEdBQVI7UUFDSSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsNEJBQUssRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELDhCQUFPLEdBQVA7UUFDSSxJQUFJLE1BQU0sR0FBRyxnQ0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQTFCUSxZQUFZO1FBRHhCLGlCQUFVLEVBQUU7O09BQ0EsWUFBWSxDQThCeEI7SUFBRCxtQkFBQztDQUFBLEFBOUJELElBOEJDO0FBOUJZLG9DQUFZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyeGpzL2FkZC9vcGVyYXRvci9tYXAnO1xuXG5pbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwRXZlbnQsIEh0dHBIYW5kbGVyLCBIdHRwSW50ZXJjZXB0b3IsIEh0dHBSZXF1ZXN0LCBIdHRwSGVhZGVycywgSHR0cEVycm9yUmVzcG9uc2UgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBJbmplY3RhYmxlLCBpc0Rldk1vZGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuaW1wb3J0IHsgQWN0aXZpdHkgfSBmcm9tIFwiLi4vX21vZGVscy9hY3Rpdml0eVwiO1xuaW1wb3J0IHtcbiAgICBnZXRCb29sZWFuLFxuICAgIHNldEJvb2xlYW4sXG4gICAgZ2V0TnVtYmVyLFxuICAgIHNldE51bWJlcixcbiAgICBnZXRTdHJpbmcsXG4gICAgc2V0U3RyaW5nLFxuICAgIGhhc0tleSxcbiAgICByZW1vdmUsXG4gICAgY2xlYXJcbn0gZnJvbSBcImFwcGxpY2F0aW9uLXNldHRpbmdzXCI7XG5cblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFN0YXRlU2VydmljZXtcbiAgICBjb25zdHJ1Y3Rvcigpe31cblxuICAgIHNhdmVVc2VyKHVzZXIpe1xuICAgICAgICBjb25zb2xlLmxvZyhcInNhdmluZyB1c2VyIFwiICsgdXNlcik7XG4gICAgICAgIHNldFN0cmluZygndXNlcicsIHVzZXIpO1xuICAgIH1cblxuICAgIHNhdmVTaWduSW4oKXtcbiAgICAgICAgY29uc29sZS5sb2coJ3NldHRpbmcgc2lnbmVkIGluIHZhbHVlLi4uJyk7XG4gICAgICAgIHNldEJvb2xlYW4oJ2lzU2lnbmVkSW4nLCB0cnVlKTtcbiAgICB9XG5cbiAgICBnZXRTaWduSW4oKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJnZXR0aW5nIHNpZ24gaW4gc3RhdHVzLi4uLi5cIik7XG4gICAgICAgIHJldHVybiBnZXRCb29sZWFuKCdpc1NpZ25lZEluJyk7XG4gICAgfVxuXG4gICAgY2xlYXJBbGwoKXtcbiAgICAgICAgY29uc29sZS5sb2coJ2NsZWFyaW5nIHZhbHVlcy4uLicpO1xuICAgICAgICBjbGVhcigpO1xuICAgIH1cblxuICAgIGdldFVzZXIoKXtcbiAgICAgICAgdmFyIG15VXNlciA9IGdldFN0cmluZygndXNlcicpO1xuICAgICAgICByZXR1cm4gbXlVc2VyO1xuICAgIH1cblxuXG5cbn0iXX0=