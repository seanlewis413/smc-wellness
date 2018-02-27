"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Activity = (function () {
    function Activity(id, activityType, totalPts, choices, question) {
        this.id = id;
        this.totalPts = totalPts;
        this.choices = choices;
        this.question = question;
        this.activityType = activityType;
    }
    Activity.prototype.setValue = function (val) {
        this.totalPts = val;
    };
    return Activity;
}());
exports.Activity = Activity;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhY3Rpdml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBO0lBU0ksa0JBQVksRUFBRSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVE7UUFDckQsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztJQUNyQyxDQUFDO0lBRU0sMkJBQVEsR0FBZixVQUFnQixHQUFHO1FBQ2YsSUFBSSxDQUFDLFFBQVEsR0FBQyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBcEJELElBb0JDO0FBcEJZLDRCQUFRIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIEFjdGl2aXR5IHtcbiAgICBcbiAgICBpZDogc3RyaW5nO1xuICAgIHRvdGFsUHRzOiBudW1iZXJ8bnVsbDtcbiAgICBjaG9pY2VzOiBBcnJheTxhbnk+O1xuICAgIHF1ZXN0aW9uOiBzdHJpbmc7XG4gICAgYWN0aXZpdHlUeXBlOiBhbnk7XG4gICAgXG5cbiAgICBjb25zdHJ1Y3RvcihpZCwgYWN0aXZpdHlUeXBlICx0b3RhbFB0cywgY2hvaWNlcywgcXVlc3Rpb24pe1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMudG90YWxQdHMgPSB0b3RhbFB0cztcbiAgICAgICAgdGhpcy5jaG9pY2VzID0gY2hvaWNlcztcbiAgICAgICAgdGhpcy5xdWVzdGlvbiA9IHF1ZXN0aW9uO1xuICAgICAgICB0aGlzLmFjdGl2aXR5VHlwZSA9IGFjdGl2aXR5VHlwZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0VmFsdWUodmFsKXtcbiAgICAgICAgdGhpcy50b3RhbFB0cz12YWw7XG4gICAgfVxufSJdfQ==