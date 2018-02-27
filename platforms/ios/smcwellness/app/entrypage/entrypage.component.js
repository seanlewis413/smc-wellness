"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("tns-core-modules/ui/page/page");
var activity_1 = require("../_models/activity");
var index_service_1 = require("../_services/index.service");
var router_1 = require("@angular/router");
var EntryPageComponent = (function () {
    function EntryPageComponent(api, page, route, router, savedData) {
        // Initialize default values.
        this.api = api;
        this.page = page;
        this.route = route;
        this.router = router;
        this.savedData = savedData;
        this.isConnected = false;
        this.hasActivities = false;
        // Your TypeScript logic goes here
        this.left = '◀︎';
        this.right = '▶︎';
        this.isTeamCaptain = true;
        this.categories = [
            { title: 'Diet', id: 'diet' },
            { title: 'Exercise', id: 'exercise' },
            { title: 'Sleep/Water', id: 'sleep-water' },
            { title: 'Bad Habits', id: 'bad-habits' },
            { title: 'Bonus Challenge', id: 'bonus-challenge' }
        ];
        this.days = [
            { title: 'Sunday', isDone: false },
            { title: 'Monday', isDone: false },
            { title: 'Tuesday', isDone: false },
            { title: 'Wednesday', isDone: false },
            { title: 'Thursday', isDone: false },
            { title: 'Friday', isDone: false },
            { title: 'Saturday', isDone: false }
        ];
        this.dayIsDone = false;
        this.makeChoice = function (args) {
            var item = args.object.item;
            var myItems = args.object.list;
            var myItems = eval(myItems);
            var myAct = args.object.activity;
            //Set value of activity
            console.log('Setting vallue for ' + myAct);
            this.activities.forEach(function (activity) {
                for (var act = 0; act < activity.length; act++) {
                    if (activity[act].id == myAct) {
                        activity[act].setValue(item);
                    }
                }
            });
            //Change button to green
            for (var i = 0; i <= myItems.length - 1; i++) {
                if (myItems[i].value == item) {
                    console.log(String(myAct) + myItems[i].value + " should be green");
                    this.page.addCss("#" + String(myAct) + myItems[i].value + "{background-color:#5db64e;}");
                }
                else {
                    console.log(String(myAct) + myItems[i].value + " should be grey");
                    this.page.addCss("#" + String(myAct) + myItems[i].value + "{background-color:transparent;}");
                }
                ;
            }
            ;
            //Set day as complete if done
            //Loop through all activities
            actloop: for (var act = 0; act < this.activities.length; act++) {
                //Loop through internal list of activities
                for (var i = 0; i < this.activities[act].length; i++) {
                    if (this.activities[act][i].totalPts == null) {
                        console.log("-------BREAK POINT-------");
                        this.dayIsDone = false;
                        break actloop;
                    }
                    else {
                        this.dayIsDone = true;
                    }
                }
            }
            ;
        };
    }
    EntryPageComponent.prototype.ngOnInit = function () {
        this.user = this.savedData.getUser();
        this.page.actionBarHidden = true;
        this.today = new Date().getDay();
        //this.today = 0;
        this.isoDate = new Date().toISOString().split('T')[0];
        /**
         * Unnamed variable list for activities
         */
        this.activities = [
            //Breakfast
            [],
            //Exercise
            [],
            //Sleep/Water
            [new activity_1.Activity('goodSleep', 'Sleep/Water', 0, [
                    { title: "No", value: 0 },
                    { title: "Yes", value: 1 }
                ], "Did you get between 7 and 9 hours of sleep?")],
            //Bad Habits
            [new activity_1.Activity('alcohol', 'Bad Habits', -1, [
                    { title: "No", value: 0 },
                    { title: "Yes", value: -1 }
                ], 'Did you drink more than one serving of alcohol?')],
            //Bonus challenge
            [new activity_1.Activity('bonus', 'Bonus Challenge', null, [
                    { title: "No", value: 0 },
                    { title: "Yes", value: 1 }
                ], 'Did you do the bonus? (Get up to walk around every hour)')]
        ];
        /**
         * get new data
         */
        this.getData();
    };
    EntryPageComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        this.activities.forEach(function (activity) {
            console.log(activity);
            for (var i = 0; i < activity.length; i++) {
                console.log('adding css.... ' + '#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                _this.page.addCss('#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
            }
            ;
        });
    };
    EntryPageComponent.prototype.checkStatus = function () {
        console.log("");
        console.log(".................CHECKING.................");
        console.log("");
        this.activities.forEach(function (activity) {
            activity.forEach(function (element) {
                console.log(element.id + " total points are " + element.totalPts);
            });
        });
        console.log(this.dayIsDone);
    };
    ;
    EntryPageComponent.prototype.getData = function () {
        var _this = this;
        if (!this.hasActivities) {
            for (var i = 0; i < this.activities.length; i++) {
                if (!this.activities[i].length) {
                    this.hasActivities = false;
                    console.log('missing activities...');
                    break;
                }
                ;
            }
            ;
        }
        ;
        if (!this.hasActivities) {
            /**
             * Make api call, sort activities, and apply css
             */
            this.api
                .getCategories().subscribe(function (res) {
                res[0].activityLst.forEach(function (element) {
                    var myAct = new activity_1.Activity(element.id, element.category, element.totalPts, element.choices, element.question);
                    /**
                     * Put each activity into the resepctive category
                     */
                    for (var i_1 = 0; i_1 < _this.categories.length; i_1++) {
                        if (element.category == _this.categories[i_1].title) {
                            _this.activities[i_1].push(myAct);
                        }
                    }
                });
                /**
                 * Apply CSS to relevant data
                 */
                _this.activities.forEach(function (activity) {
                    for (var i = 0; i < activity.length; i++) {
                        console.log('adding css.... ' + '#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                        _this.page.addCss('#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                    }
                    ;
                });
                /**
                 * Check if day is done or not
                 */
                checkLoop: for (var act = 0; act < _this.activities.length; act++) {
                    for (var i = 0; i < _this.activities[act].length; i++) {
                        if (_this.activities[act][i].totalPts == null) {
                            console.log('-----BREAK POINT-----');
                            _this.days[_this.today].isDone = false;
                            break checkLoop;
                        }
                        else {
                            _this.days[_this.today].isDone = true;
                        }
                    }
                }
                ;
                _this.isConnected = true;
                _this.hasActivities = true;
            }, function (err) { return console.log('ERROR IS... ' + err.message); });
        }
        else {
            //TODO: update existing activities with new values
            this.api
                .getCategories().subscribe(function (res) {
                res[0].activityLst.forEach(function (element) {
                    var myNewScore = (element.totalPts, element.id);
                    /**
                     * Update point totals
                     */
                    _this.activities.forEach(function (category) {
                        category.forEach(function (activity) {
                            if (activity.id == element.id) {
                                activity.setValue(element.totalPts);
                            }
                        });
                    });
                });
                /**
                 * Apply CSS to relevant data
                 */
                _this.activities.forEach(function (activity) {
                    for (var i = 0; i < activity.length; i++) {
                        console.log('adding css.... ' + '#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                        _this.page.addCss('#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                    }
                    ;
                });
                /**
                 * Check if day is done or not
                 */
                checkLoop: for (var act = 0; act < _this.activities.length; act++) {
                    for (var i = 0; i < _this.activities[act].length; i++) {
                        if (_this.activities[act][i].totalPts == null) {
                            console.log('-----BREAK POINT-----');
                            _this.days[_this.today].isDone = false;
                            break checkLoop;
                        }
                        else {
                            _this.days[_this.today].isDone = true;
                        }
                    }
                }
                ;
                _this.isConnected = true;
            }, function (err) { return console.log('ERROR IS... ' + err.message); });
        }
    };
    /**
     * Kill current activity list so that new data can be pulled, and get rid of css
     */
    EntryPageComponent.prototype.clearCurrentState = function () {
        var _this = this;
        this.activities.forEach(function (activity) {
            activity.forEach(function (element) {
                element.choices.forEach(function (choice) {
                    _this.page.addCss('#' + element.id + choice.value + '{background-color: transparent}');
                });
            });
        });
        this.activities.forEach(function (category) {
            category.forEach(function (activity) {
                activity.totalPts = null;
            });
        });
    };
    EntryPageComponent.prototype.logout = function () {
        /**
         * clear css and list in memory
         */
        this.clearCurrentState();
        /**
         * clear all session data stored in hard drive
         */
        this.savedData.clearAll();
        /**
         * navigate to login page
         */
        this.router.navigate(['/login']);
    };
    EntryPageComponent.prototype.saveTest = function () {
        this.api.saveToken("THIS IS MY NEW TEST");
        console.log('setting value....');
    };
    EntryPageComponent.prototype.getTest = function () {
        console.log('getting value....');
        this.api.getToken();
    };
    EntryPageComponent.prototype.clearTest = function () {
        console.log('clearing all values....');
        this.api.clearToken();
    };
    EntryPageComponent.prototype.checkHtml = function () {
        console.log(this.myhtml);
    };
    EntryPageComponent.prototype.switchDay = function (n) {
        this.today += n;
        this.dayIsDone = this.days[this.today].isDone;
        this.clearCurrentState();
        this.getData();
    };
    __decorate([
        core_1.ViewChild("topRef"),
        __metadata("design:type", core_1.ElementRef)
    ], EntryPageComponent.prototype, "topRef", void 0);
    EntryPageComponent = __decorate([
        core_1.Component({
            selector: "my-app",
            moduleId: module.id,
            templateUrl: "./entrypage.component.html",
            styleUrls: ["entrypage.component.css", "../app.css"],
            providers: [index_service_1.BackendService, index_service_1.StateService]
        }),
        __metadata("design:paramtypes", [index_service_1.BackendService,
            page_1.Page,
            router_1.ActivatedRoute,
            router_1.Router,
            index_service_1.StateService])
    ], EntryPageComponent);
    return EntryPageComponent;
}());
exports.EntryPageComponent = EntryPageComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnlwYWdlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVudHJ5cGFnZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMEc7QUFDMUcsc0RBQXFEO0FBR3JELGdEQUErQztBQU0vQyw0REFBMEU7QUFJMUUsMENBQXlEO0FBZ0J6RDtJQTBDSSw0QkFDWSxHQUFtQixFQUNuQixJQUFVLEVBQ1YsS0FBcUIsRUFDckIsTUFBYyxFQUNkLFNBQXVCO1FBSy9CLDZCQUE2QjtRQVRyQixRQUFHLEdBQUgsR0FBRyxDQUFnQjtRQUNuQixTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ1YsVUFBSyxHQUFMLEtBQUssQ0FBZ0I7UUFDckIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLGNBQVMsR0FBVCxTQUFTLENBQWM7UUE1Q25DLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBRTdCLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBRWpDLGtDQUFrQztRQUNoQyxTQUFJLEdBQVcsSUFBSSxDQUFDO1FBQ3BCLFVBQUssR0FBVyxJQUFJLENBQUM7UUFRckIsa0JBQWEsR0FBVSxJQUFJLENBQUM7UUFFNUIsZUFBVSxHQUFvQjtZQUMxQixFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBQztZQUMzQixFQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBQztZQUNuQyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBQztZQUN6QyxFQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBQztZQUN2QyxFQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsaUJBQWlCLEVBQUM7U0FDcEQsQ0FBQztRQUVGLFNBQUksR0FBZTtZQUNmLEVBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFDO1lB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QUksQ0FBQyxPQUFPLEVBQVcsQ0FBQztJQUM1QixDQUFDO0lBcllvQjtRQUFwQixnQkFBUyxDQUFDLFFBQVEsQ0FBQztrQ0FBUyxpQkFBVTtzREFBQztJQUQvQixrQkFBa0I7UUFQOUIsZ0JBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixXQUFXLEVBQUUsNEJBQTRCO1lBQ3pDLFNBQVMsRUFBRSxDQUFDLHlCQUF5QixFQUFFLFlBQVksQ0FBQztZQUNwRCxTQUFTLEVBQUMsQ0FBQyw4QkFBYyxFQUFFLDRCQUFZLENBQUM7U0FDekMsQ0FBQzt5Q0E0Q21CLDhCQUFjO1lBQ2IsV0FBSTtZQUNILHVCQUFjO1lBQ2IsZUFBTTtZQUNILDRCQUFZO09BL0MxQixrQkFBa0IsQ0F3WTlCO0lBQUQseUJBQUM7Q0FBQSxBQXhZRCxJQXdZQztBQXhZWSxnREFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgSW5qZWN0YWJsZSwgSW5wdXQsIEVsZW1lbnRSZWYsIFZpZXdDaGlsZCwgQWZ0ZXJWaWV3SW5pdH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3VpL3BhZ2UvcGFnZSc7XG5pbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgRnJhbWUgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3VpL2ZyYW1lL2ZyYW1lJztcbmltcG9ydCB7IEFjdGl2aXR5IH0gZnJvbSAnLi4vX21vZGVscy9hY3Rpdml0eSc7XG5cbmltcG9ydCAqIGFzIG9ic2VydmFibGVBcnJheSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9kYXRhL29ic2VydmFibGUtYXJyYXlcIjtcbmltcG9ydCAqIGFzIGxhYmVsTW9kdWxlIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2xhYmVsXCI7XG5pbXBvcnQgKiBhcyByZXBlYXRlck1vZHVsZSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9yZXBlYXRlclwiO1xuXG5pbXBvcnQgeyBCYWNrZW5kU2VydmljZSwgU3RhdGVTZXJ2aWNlIH0gZnJvbSAnLi4vX3NlcnZpY2VzL2luZGV4LnNlcnZpY2UnO1xuaW1wb3J0IHsgSHR0cENsaWVudCwgSHR0cEV2ZW50LCBIdHRwSGFuZGxlciwgSHR0cEludGVyY2VwdG9yLCBIdHRwUmVxdWVzdCwgSHR0cEhlYWRlcnMsIEh0dHBFcnJvclJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgR2VzdHVyZUV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2dlc3R1cmVzL2dlc3R1cmVzXCI7XG5pbXBvcnQgeyBjYXRlZ29yaWVzIH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdHJhY2UvdHJhY2VcIjtcbmltcG9ydCB7IFJvdXRlciwgQWN0aXZhdGVkUm91dGUgfSBmcm9tIFwiQGFuZ3VsYXIvcm91dGVyXCI7XG5pbXBvcnQgeyBXZWJWaWV3LCBMb2FkRXZlbnREYXRhIH0gZnJvbSBcInVpL3dlYi12aWV3XCI7XG5pbXBvcnQgeyBIdG1sVmlldyB9IGZyb20gJ3VpL2h0bWwtdmlldyc7XG5pbXBvcnQgeyBDaGFydCB9IGZyb20gJ2NoYXJ0LmpzJztcbmltcG9ydCB7IERheSB9IGZyb20gXCIuLi9fbW9kZWxzL2RheVwiO1xuaW1wb3J0IHsgQ2F0ZWdvcnkgfSBmcm9tICcuLi9fbW9kZWxzL2NhdGVnb3J5J1xuXG5cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcIm15LWFwcFwiLFxuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxuICB0ZW1wbGF0ZVVybDogXCIuL2VudHJ5cGFnZS5jb21wb25lbnQuaHRtbFwiLCBcbiAgc3R5bGVVcmxzOiBbXCJlbnRyeXBhZ2UuY29tcG9uZW50LmNzc1wiLCBcIi4uL2FwcC5jc3NcIl0sXG4gIHByb3ZpZGVyczpbQmFja2VuZFNlcnZpY2UsIFN0YXRlU2VydmljZV1cbn0pXG5leHBvcnQgY2xhc3MgRW50cnlQYWdlQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBBZnRlclZpZXdJbml0e1xuICAgIEBWaWV3Q2hpbGQoXCJ0b3BSZWZcIikgdG9wUmVmOiBFbGVtZW50UmVmO1xuXG4gICAgaXNDb25uZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGhhc0FjdGl2aXRpZXM6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBZb3VyIFR5cGVTY3JpcHQgbG9naWMgZ29lcyBoZXJlXG4gICAgbGVmdDogc3RyaW5nID0gJ+KXgO+4jic7XG4gICAgcmlnaHQ6IHN0cmluZyA9ICfilrbvuI4nO1xuICAgIFxuICAgIHVzZXI6IHN0cmluZztcbiAgICBcbiAgICBteWh0bWw6IHN0cmluZztcblxuICAgIGFjdGl2aXRpZXM6IEFycmF5PEFycmF5PEFjdGl2aXR5Pj47XG4gICAgXG4gICAgaXNUZWFtQ2FwdGFpbjogYm9vbGVhbj10cnVlO1xuXG4gICAgY2F0ZWdvcmllczogQXJyYXk8Q2F0ZWdvcnk+ID0gW1xuICAgICAgICB7dGl0bGU6ICdEaWV0JywgaWQ6ICdkaWV0J30sXG4gICAgICAgIHt0aXRsZTogJ0V4ZXJjaXNlJywgaWQ6ICdleGVyY2lzZSd9LFxuICAgICAgICB7dGl0bGU6ICdTbGVlcC9XYXRlcicsIGlkOiAnc2xlZXAtd2F0ZXInfSxcbiAgICAgICAge3RpdGxlOiAnQmFkIEhhYml0cycsIGlkOiAnYmFkLWhhYml0cyd9LFxuICAgICAgICB7dGl0bGU6ICdCb251cyBDaGFsbGVuZ2UnLCBpZDogJ2JvbnVzLWNoYWxsZW5nZSd9XG4gICAgXTtcblxuICAgIGRheXM6IEFycmF5PERheT4gPSBbXG4gICAgICAgIHt0aXRsZTogJ1N1bmRheScsIGlzRG9uZTogZmFsc2V9LFxuICAgICAgICB7dGl0bGU6ICdNb25kYXknLCBpc0RvbmU6IGZhbHNlfSxcbiAgICAgICAge3RpdGxlOiAnVHVlc2RheScsIGlzRG9uZTogZmFsc2V9LFxuICAgICAgICB7dGl0bGU6ICdXZWRuZXNkYXknLCBpc0RvbmU6IGZhbHNlfSxcbiAgICAgICAge3RpdGxlOiAnVGh1cnNkYXknLCBpc0RvbmU6IGZhbHNlfSxcbiAgICAgICAge3RpdGxlOiAnRnJpZGF5JywgaXNEb25lOiBmYWxzZX0sXG4gICAgICAgIHt0aXRsZTogJ1NhdHVyZGF5JywgaXNEb25lOiBmYWxzZX1cbiAgICBdO1xuICAgIHRvZGF5OiBudW1iZXI7XG5cbiAgICBpc29EYXRlOiBhbnk7XG5cbiAgICBkYXlJc0RvbmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIGFwaTogQmFja2VuZFNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgcGFnZTogUGFnZSxcbiAgICAgICAgcHJpdmF0ZSByb3V0ZTogQWN0aXZhdGVkUm91dGUsXG4gICAgICAgIHByaXZhdGUgcm91dGVyOiBSb3V0ZXIsXG4gICAgICAgIHByaXZhdGUgc2F2ZWREYXRhOiBTdGF0ZVNlcnZpY2VcbiAgICApIHtcblxuICAgIFxuXG4gICAgICAgIC8vIEluaXRpYWxpemUgZGVmYXVsdCB2YWx1ZXMuXG4gICAgICAgIFxuXG4gICAgICAgIFxuICAgICAgICB9XG5cblxuICAgIG5nT25Jbml0KCkge1xuICAgICAgICB0aGlzLnVzZXIgPSB0aGlzLnNhdmVkRGF0YS5nZXRVc2VyKCk7XG4gICAgICAgIHRoaXMucGFnZS5hY3Rpb25CYXJIaWRkZW4gPSB0cnVlO1xuICAgICAgICB0aGlzLnRvZGF5ID0gbmV3IERhdGUoKS5nZXREYXkoKTtcbiAgICAgICAgLy90aGlzLnRvZGF5ID0gMDtcbiAgICAgICAgdGhpcy5pc29EYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5uYW1lZCB2YXJpYWJsZSBsaXN0IGZvciBhY3Rpdml0aWVzXG4gICAgICAgICAqL1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hY3Rpdml0aWVzID0gW1xuICAgICAgICAgICAgLy9CcmVha2Zhc3RcbiAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgLy9FeGVyY2lzZVxuICAgICAgICAgICAgW10sXG4gICAgICAgICAgICAvL1NsZWVwL1dhdGVyXG4gICAgICAgICAgICBbbmV3IEFjdGl2aXR5KCdnb29kU2xlZXAnLCAnU2xlZXAvV2F0ZXInLCAwLCBbXG4gICAgICAgICAgICAgICAge3RpdGxlOlwiTm9cIiwgdmFsdWU6IDB9LFxuICAgICAgICAgICAgICAgIHt0aXRsZTpcIlllc1wiLCB2YWx1ZTogMX1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFwiRGlkIHlvdSBnZXQgYmV0d2VlbiA3IGFuZCA5IGhvdXJzIG9mIHNsZWVwP1wiKV0sXG4gICAgICAgICAgICAvL0JhZCBIYWJpdHNcbiAgICAgICAgICAgIFtuZXcgQWN0aXZpdHkoJ2FsY29ob2wnLCdCYWQgSGFiaXRzJywgLTEsIFtcbiAgICAgICAgICAgICAgICB7dGl0bGU6XCJOb1wiLCB2YWx1ZTogMH0sXG4gICAgICAgICAgICAgICAge3RpdGxlOlwiWWVzXCIsIHZhbHVlOiAtMX1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICdEaWQgeW91IGRyaW5rIG1vcmUgdGhhbiBvbmUgc2VydmluZyBvZiBhbGNvaG9sPycpXSxcbiAgICAgICAgICAgIC8vQm9udXMgY2hhbGxlbmdlXG4gICAgICAgICAgICBbbmV3IEFjdGl2aXR5KCdib251cycsJ0JvbnVzIENoYWxsZW5nZScsIG51bGwsIFtcbiAgICAgICAgICAgICAgICB7dGl0bGU6XCJOb1wiLCB2YWx1ZTogMH0sXG4gICAgICAgICAgICAgICAge3RpdGxlOlwiWWVzXCIsIHZhbHVlOiAxfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgJ0RpZCB5b3UgZG8gdGhlIGJvbnVzPyAoR2V0IHVwIHRvIHdhbGsgYXJvdW5kIGV2ZXJ5IGhvdXIpJyldXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXQgbmV3IGRhdGFcbiAgICAgICAgICovXG5cbiAgICAgICAgdGhpcy5nZXREYXRhKCk7XG5cbiAgICAgICAgICAgIFxuICAgICAgICBcbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKXtcbiAgICAgICAgdGhpcy5hY3Rpdml0aWVzLmZvckVhY2goKGFjdGl2aXR5KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhY3Rpdml0eSk7ICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGFjdGl2aXR5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkaW5nIGNzcy4uLi4gJyArICcjJyArIGFjdGl2aXR5W2ldLmlkICsgU3RyaW5nKGFjdGl2aXR5W2ldLnRvdGFsUHRzKSArIFwie2JhY2tncm91bmQtY29sb3I6IzVkYjY0ZTt9XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFnZS5hZGRDc3MoJyMnICsgYWN0aXZpdHlbaV0uaWQgKyBTdHJpbmcoYWN0aXZpdHlbaV0udG90YWxQdHMpICsgXCJ7YmFja2dyb3VuZC1jb2xvcjojNWRiNjRlO31cIik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjaGVja1N0YXR1cygpe1xuICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCIuLi4uLi4uLi4uLi4uLi4uLkNIRUNLSU5HLi4uLi4uLi4uLi4uLi4uLi5cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiXCIpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hY3Rpdml0aWVzLmZvckVhY2goYWN0aXZpdHkgPT4ge1xuICAgICAgICAgICAgYWN0aXZpdHkuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlbGVtZW50LmlkICsgXCIgdG90YWwgcG9pbnRzIGFyZSBcIiArIGVsZW1lbnQudG90YWxQdHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7ICAgXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGF5SXNEb25lKTtcbiAgICB9O1xuXG4gICAgZ2V0RGF0YSgpe1xuICAgICAgICBpZighdGhpcy5oYXNBY3Rpdml0aWVzKXtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLmFjdGl2aXRpZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5hY3Rpdml0aWVzW2ldLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzQWN0aXZpdGllcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbWlzc2luZyBhY3Rpdml0aWVzLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmKCF0aGlzLmhhc0FjdGl2aXRpZXMpe1xuICAgICAgICAvKipcbiAgICAgICAgICogTWFrZSBhcGkgY2FsbCwgc29ydCBhY3Rpdml0aWVzLCBhbmQgYXBwbHkgY3NzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFwaVxuICAgICAgICAgICAgLmdldENhdGVnb3JpZXMoKS5zdWJzY3JpYmUoKHJlczogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzWzBdLmFjdGl2aXR5THN0LmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBteUFjdCA9IG5ldyBBY3Rpdml0eShlbGVtZW50LmlkLCBlbGVtZW50LmNhdGVnb3J5LCBlbGVtZW50LnRvdGFsUHRzLCBlbGVtZW50LmNob2ljZXMsIGVsZW1lbnQucXVlc3Rpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBQdXQgZWFjaCBhY3Rpdml0eSBpbnRvIHRoZSByZXNlcGN0aXZlIGNhdGVnb3J5XG4gICAgICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLmNhdGVnb3JpZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZWxlbWVudC5jYXRlZ29yeSA9PSB0aGlzLmNhdGVnb3JpZXNbaV0udGl0bGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZpdGllc1tpXS5wdXNoKG15QWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXBwbHkgQ1NTIHRvIHJlbGV2YW50IGRhdGFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZpdGllcy5mb3JFYWNoKChhY3Rpdml0eSkgPT4geyAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGFjdGl2aXR5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGRpbmcgY3NzLi4uLiAnICsgJyMnICsgYWN0aXZpdHlbaV0uaWQgKyBTdHJpbmcoYWN0aXZpdHlbaV0udG90YWxQdHMpICsgXCJ7YmFja2dyb3VuZC1jb2xvcjojNWRiNjRlO31cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhZ2UuYWRkQ3NzKCcjJyArIGFjdGl2aXR5W2ldLmlkICsgU3RyaW5nKGFjdGl2aXR5W2ldLnRvdGFsUHRzKSArIFwie2JhY2tncm91bmQtY29sb3I6IzVkYjY0ZTt9XCIpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hlY2sgaWYgZGF5IGlzIGRvbmUgb3Igbm90XG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgY2hlY2tMb29wOiBmb3IobGV0IGFjdCA9IDA7IGFjdCA8IHRoaXMuYWN0aXZpdGllcy5sZW5ndGg7IGFjdCsrKXtcblxuICAgICAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmFjdGl2aXRpZXNbYWN0XS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuYWN0aXZpdGllc1thY3RdW2ldLnRvdGFsUHRzID09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tQlJFQUsgUE9JTlQtLS0tLScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW3RoaXMudG9kYXldLmlzRG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWsgY2hlY2tMb29wO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlzW3RoaXMudG9kYXldLmlzRG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzQWN0aXZpdGllcyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyOiBIdHRwRXJyb3JSZXNwb25zZSkgPT4gY29uc29sZS5sb2coJ0VSUk9SIElTLi4uICcgKyBlcnIubWVzc2FnZSkpOyAgICAgICBcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAvL1RPRE86IHVwZGF0ZSBleGlzdGluZyBhY3Rpdml0aWVzIHdpdGggbmV3IHZhbHVlc1xuXG5cbiAgICAgICAgICAgIHRoaXMuYXBpXG4gICAgICAgICAgICAuZ2V0Q2F0ZWdvcmllcygpLnN1YnNjcmliZSgocmVzOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNbMF0uYWN0aXZpdHlMc3QuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG15TmV3U2NvcmUgPSAoZWxlbWVudC50b3RhbFB0cywgZWxlbWVudC5pZClcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogVXBkYXRlIHBvaW50IHRvdGFsc1xuICAgICAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2aXRpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeS5mb3JFYWNoKGFjdGl2aXR5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihhY3Rpdml0eS5pZCA9PSBlbGVtZW50LmlkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHkuc2V0VmFsdWUoZWxlbWVudC50b3RhbFB0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBcHBseSBDU1MgdG8gcmVsZXZhbnQgZGF0YVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpdml0aWVzLmZvckVhY2goKGFjdGl2aXR5KSA9PiB7ICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYWN0aXZpdHkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZGluZyBjc3MuLi4uICcgKyAnIycgKyBhY3Rpdml0eVtpXS5pZCArIFN0cmluZyhhY3Rpdml0eVtpXS50b3RhbFB0cykgKyBcIntiYWNrZ3JvdW5kLWNvbG9yOiM1ZGI2NGU7fVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFnZS5hZGRDc3MoJyMnICsgYWN0aXZpdHlbaV0uaWQgKyBTdHJpbmcoYWN0aXZpdHlbaV0udG90YWxQdHMpICsgXCJ7YmFja2dyb3VuZC1jb2xvcjojNWRiNjRlO31cIik7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGVjayBpZiBkYXkgaXMgZG9uZSBvciBub3RcbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICBjaGVja0xvb3A6IGZvcihsZXQgYWN0ID0gMDsgYWN0IDwgdGhpcy5hY3Rpdml0aWVzLmxlbmd0aDsgYWN0Kyspe1xuXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuYWN0aXZpdGllc1thY3RdLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5hY3Rpdml0aWVzW2FjdF1baV0udG90YWxQdHMgPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnLS0tLS1CUkVBSyBQT0lOVC0tLS0tJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXNbdGhpcy50b2RheV0uaXNEb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhayBjaGVja0xvb3A7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRheXNbdGhpcy50b2RheV0uaXNEb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoZXJyOiBIdHRwRXJyb3JSZXNwb25zZSkgPT4gY29uc29sZS5sb2coJ0VSUk9SIElTLi4uICcgKyBlcnIubWVzc2FnZSkpOyAgXG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgXG4gICAgbWFrZUNob2ljZSA9IGZ1bmN0aW9uKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgICAgICB2YXIgaXRlbSA9IGFyZ3Mub2JqZWN0Lml0ZW07ICAgICAgICBcbiAgICAgICAgdmFyIG15SXRlbXM9YXJncy5vYmplY3QubGlzdDtcbiAgICAgICAgdmFyIG15SXRlbXM9ZXZhbChteUl0ZW1zKTtcbiAgICAgICAgdmFyIG15QWN0ID0gYXJncy5vYmplY3QuYWN0aXZpdHk7XG5cbiAgICAgICAgLy9TZXQgdmFsdWUgb2YgYWN0aXZpdHlcbiAgICAgICAgY29uc29sZS5sb2coJ1NldHRpbmcgdmFsbHVlIGZvciAnICsgbXlBY3QpO1xuXG4gICAgICAgIHRoaXMuYWN0aXZpdGllcy5mb3JFYWNoKGFjdGl2aXR5ID0+IHtcblxuICAgICAgICAgICAgZm9yKHZhciBhY3QgPSAwOyBhY3QgPCBhY3Rpdml0eS5sZW5ndGg7IGFjdCsrKXtcbiAgICAgICAgICAgICAgICBpZihhY3Rpdml0eVthY3RdLmlkID09IG15QWN0KXtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlbYWN0XS5zZXRWYWx1ZShpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9DaGFuZ2UgYnV0dG9uIHRvIGdyZWVuXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbXlJdGVtcy5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICBpZihteUl0ZW1zW2ldLnZhbHVlPT1pdGVtKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFN0cmluZyhteUFjdCkgKyBteUl0ZW1zW2ldLnZhbHVlICsgXCIgc2hvdWxkIGJlIGdyZWVuXCIpO1xuICAgICAgICAgICAgdGhpcy5wYWdlLmFkZENzcyhcIiNcIiArIFN0cmluZyhteUFjdCkgKyBteUl0ZW1zW2ldLnZhbHVlICsgXCJ7YmFja2dyb3VuZC1jb2xvcjojNWRiNjRlO31cIik7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFN0cmluZyhteUFjdCkgKyBteUl0ZW1zW2ldLnZhbHVlICsgXCIgc2hvdWxkIGJlIGdyZXlcIik7XG4gICAgICAgICAgICB0aGlzLnBhZ2UuYWRkQ3NzKFwiI1wiICsgU3RyaW5nKG15QWN0KSArIG15SXRlbXNbaV0udmFsdWUgKyBcIntiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O31cIik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vU2V0IGRheSBhcyBjb21wbGV0ZSBpZiBkb25lXG5cbiAgICAgICAvL0xvb3AgdGhyb3VnaCBhbGwgYWN0aXZpdGllc1xuXG4gICAgICAgIGFjdGxvb3A6IGZvcih2YXIgYWN0ID0gMDsgYWN0IDwgdGhpcy5hY3Rpdml0aWVzLmxlbmd0aDsgYWN0Kyspe1xuXG4gICAgICAgICAgICAvL0xvb3AgdGhyb3VnaCBpbnRlcm5hbCBsaXN0IG9mIGFjdGl2aXRpZXNcblxuICAgICAgICAgICAgZm9yKHZhciBpPTA7IGkgPCB0aGlzLmFjdGl2aXRpZXNbYWN0XS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5hY3Rpdml0aWVzW2FjdF1baV0udG90YWxQdHMgPT0gbnVsbCl7IFxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS1CUkVBSyBQT0lOVC0tLS0tLS1cIilcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXlJc0RvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWsgYWN0bG9vcDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRheUlzRG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICBcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBLaWxsIGN1cnJlbnQgYWN0aXZpdHkgbGlzdCBzbyB0aGF0IG5ldyBkYXRhIGNhbiBiZSBwdWxsZWQsIGFuZCBnZXQgcmlkIG9mIGNzc1xuICAgICAqL1xuICAgIGNsZWFyQ3VycmVudFN0YXRlKCl7XG4gICAgICAgIHRoaXMuYWN0aXZpdGllcy5mb3JFYWNoKChhY3Rpdml0eSkgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBhY3Rpdml0eS5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jaG9pY2VzLmZvckVhY2goY2hvaWNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWdlLmFkZENzcygnIycgKyBlbGVtZW50LmlkICsgY2hvaWNlLnZhbHVlICsgJ3tiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudH0nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFjdGl2aXRpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XG4gICAgICAgICAgICBjYXRlZ29yeS5mb3JFYWNoKGFjdGl2aXR5ID0+IHtcbiAgICAgICAgICAgICAgICBhY3Rpdml0eS50b3RhbFB0cyA9IG51bGw7ICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cblxuICAgIH1cblxuICAgIGxvZ291dCgpe1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNsZWFyIGNzcyBhbmQgbGlzdCBpbiBtZW1vcnlcbiAgICAgICAgICovXG5cbiAgICAgICAgdGhpcy5jbGVhckN1cnJlbnRTdGF0ZSgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjbGVhciBhbGwgc2Vzc2lvbiBkYXRhIHN0b3JlZCBpbiBoYXJkIGRyaXZlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNhdmVkRGF0YS5jbGVhckFsbCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBuYXZpZ2F0ZSB0byBsb2dpbiBwYWdlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvdXRlci5uYXZpZ2F0ZShbJy9sb2dpbiddKTtcbiAgICB9XG5cbiAgICBzYXZlVGVzdCgpe1xuICAgICAgICB0aGlzLmFwaS5zYXZlVG9rZW4oXCJUSElTIElTIE1ZIE5FVyBURVNUXCIpO1xuICAgICAgICBjb25zb2xlLmxvZygnc2V0dGluZyB2YWx1ZS4uLi4nKTtcbiAgICB9XG5cbiAgICBnZXRUZXN0KCl7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXR0aW5nIHZhbHVlLi4uLicpO1xuICAgICAgICB0aGlzLmFwaS5nZXRUb2tlbigpO1xuICAgIH1cblxuICAgIGNsZWFyVGVzdCgpe1xuICAgICAgICBjb25zb2xlLmxvZygnY2xlYXJpbmcgYWxsIHZhbHVlcy4uLi4nKTtcbiAgICAgICAgdGhpcy5hcGkuY2xlYXJUb2tlbigpO1xuICAgIH1cblxuICAgIGNoZWNrSHRtbCgpe1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm15aHRtbCk7XG4gICAgfVxuXG4gICAgc3dpdGNoRGF5KG46IG51bWJlcil7XG4gICAgICAgIHRoaXMudG9kYXkgKz0gbjtcbiAgICAgICAgdGhpcy5kYXlJc0RvbmUgPSB0aGlzLmRheXNbdGhpcy50b2RheV0uaXNEb25lO1xuICAgICAgICB0aGlzLmNsZWFyQ3VycmVudFN0YXRlKCk7XG4gICAgICAgIHRoaXMuZ2V0RGF0YSgvKnRvZGF5Ki8pO1xuICAgIH1cblxufSJdfQ==