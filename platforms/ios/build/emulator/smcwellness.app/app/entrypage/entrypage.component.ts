import { Component, OnInit, Injectable, Input, ElementRef, ViewChild, AfterViewInit} from "@angular/core";
import { Page } from 'tns-core-modules/ui/page/page';
import { EventData } from 'data/observable';
import { Observable, Frame } from 'tns-core-modules/ui/frame/frame';
import { Activity } from '../_models/activity';

import * as observableArray from "tns-core-modules/data/observable-array";
import * as labelModule from "tns-core-modules/ui/label";
import * as repeaterModule from "tns-core-modules/ui/repeater";

import { BackendService, StateService } from '../_services/index.service';
import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { GestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { categories } from "tns-core-modules/trace/trace";
import { Router, ActivatedRoute } from "@angular/router";
import { WebView, LoadEventData } from "ui/web-view";
import { HtmlView } from 'ui/html-view';
import { Chart } from 'chart.js';
import { Day } from "../_models/day";
import { Category } from '../_models/category'



@Component({
  selector: "my-app",
  moduleId: module.id,
  templateUrl: "./entrypage.component.html", 
  styleUrls: ["entrypage.component.css", "../app.css"],
  providers:[BackendService, StateService]
})
export class EntryPageComponent implements OnInit, AfterViewInit{
    @ViewChild("topRef") topRef: ElementRef;

    isConnected: boolean = false;

    hasActivities: boolean = false;

  // Your TypeScript logic goes here
    left: string = '◀︎';
    right: string = '▶︎';
    
    user: string;
    
    myhtml: string;

    activities: Array<Array<Activity>>;
    
    isTeamCaptain: boolean=true;

    categories: Array<Category> = [
        {title: 'Diet', id: 'diet'},
        {title: 'Exercise', id: 'exercise'},
        {title: 'Sleep/Water', id: 'sleep-water'},
        {title: 'Bad Habits', id: 'bad-habits'},
        {title: 'Bonus Challenge', id: 'bonus-challenge'}
    ];

    days: Array<Day> = [
        {title: 'Sunday', isDone: false},
        {title: 'Monday', isDone: false},
        {title: 'Tuesday', isDone: false},
        {title: 'Wednesday', isDone: false},
        {title: 'Thursday', isDone: false},
        {title: 'Friday', isDone: false},
        {title: 'Saturday', isDone: false}
    ];
    today: number;

    isoDate: any;

    dayIsDone: boolean = false;

    constructor(
        private api: BackendService,
        private page: Page,
        private route: ActivatedRoute,
        private router: Router,
        private savedData: StateService
    ) {

    

        // Initialize default values.
        

        
        }


    ngOnInit() {
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
            [new Activity('goodSleep', 'Sleep/Water', 0, [
                {title:"No", value: 0},
                {title:"Yes", value: 1}
                ],
                "Did you get between 7 and 9 hours of sleep?")],
            //Bad Habits
            [new Activity('alcohol','Bad Habits', -1, [
                {title:"No", value: 0},
                {title:"Yes", value: -1}
                ],
                'Did you drink more than one serving of alcohol?')],
            //Bonus challenge
            [new Activity('bonus','Bonus Challenge', null, [
                {title:"No", value: 0},
                {title:"Yes", value: 1}
                ],
                'Did you do the bonus? (Get up to walk around every hour)')]
            ];

        /**
         * get new data
         */

        this.getData();

            
        
    }

    ngAfterViewInit(){
        this.activities.forEach((activity) => {
            console.log(activity);            
            for(var i=0; i < activity.length; i++){
                console.log('adding css.... ' + '#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                this.page.addCss('#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
            };
        });
    }

    checkStatus(){
        console.log("");
        console.log(".................CHECKING.................");
        console.log("");
        
        this.activities.forEach(activity => {
            activity.forEach(element => {
                console.log(element.id + " total points are " + element.totalPts);
            });
            
        });   
        console.log(this.dayIsDone);
    };

    getData(){
        if(!this.hasActivities){
            for(let i = 0; i < this.activities.length; i++){
                if (!this.activities[i].length){
                    this.hasActivities = false;
                    console.log('missing activities...');
                    break;
                };
            };
        };

        if(!this.hasActivities){
        /**
         * Make api call, sort activities, and apply css
         */
        this.api
            .getCategories().subscribe((res: any) => {
                res[0].activityLst.forEach(element => {
                    let myAct = new Activity(element.id, element.category, element.totalPts, element.choices, element.question);

                    /**
                     * Put each activity into the resepctive category
                     */

                    for(let i = 0; i < this.categories.length; i++){
                        if(element.category == this.categories[i].title){
                            this.activities[i].push(myAct);
                        }
                    }

                }
            );
            /**
             * Apply CSS to relevant data
             */
                this.activities.forEach((activity) => {            
                    for(var i=0; i < activity.length; i++){
                        console.log('adding css.... ' + '#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                        this.page.addCss('#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                    };
                    
                    
                },
                
                
            );

            /**
             * Check if day is done or not
             */

            checkLoop: for(let act = 0; act < this.activities.length; act++){

                for(var i = 0; i < this.activities[act].length; i++){
                    if(this.activities[act][i].totalPts == null){
                        console.log('-----BREAK POINT-----');
                        this.days[this.today].isDone = false;
                        break checkLoop;
                    } else {
                        this.days[this.today].isDone = true;
                    }
                }

            };
            this.isConnected = true;
            this.hasActivities = true;

                
            },
            (err: HttpErrorResponse) => console.log('ERROR IS... ' + err.message));       
        }else{
            //TODO: update existing activities with new values


            this.api
            .getCategories().subscribe((res: any) => {
                res[0].activityLst.forEach(element => {
                    let myNewScore = (element.totalPts, element.id)

                    /**
                     * Update point totals
                     */

                    this.activities.forEach(category => {
                        category.forEach(activity => {
                            if(activity.id == element.id){
                                activity.setValue(element.totalPts);
                            }
                        });
                        
                    });

                }
            );
            /**
             * Apply CSS to relevant data
             */
                this.activities.forEach((activity) => {            
                    for(var i=0; i < activity.length; i++){
                        console.log('adding css.... ' + '#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                        this.page.addCss('#' + activity[i].id + String(activity[i].totalPts) + "{background-color:#5db64e;}");
                    };
                    
                    
                },
                
                
            );

            /**
             * Check if day is done or not
             */

            checkLoop: for(let act = 0; act < this.activities.length; act++){

                for(var i = 0; i < this.activities[act].length; i++){
                    if(this.activities[act][i].totalPts == null){
                        console.log('-----BREAK POINT-----');
                        this.days[this.today].isDone = false;
                        break checkLoop;
                    } else {
                        this.days[this.today].isDone = true;
                    }
                }

            };
            this.isConnected = true;
            

                
            },
            (err: HttpErrorResponse) => console.log('ERROR IS... ' + err.message));  

        }
    }


    
    makeChoice = function(args: EventData) {
        var item = args.object.item;        
        var myItems=args.object.list;
        var myItems=eval(myItems);
        var myAct = args.object.activity;

        //Set value of activity
        console.log('Setting vallue for ' + myAct);

        this.activities.forEach(activity => {

            for(var act = 0; act < activity.length; act++){
                if(activity[act].id == myAct){
                    activity[act].setValue(item);
                }
            }
            
        });

        //Change button to green

        for (var i = 0; i <= myItems.length-1; i++) {
            if(myItems[i].value==item){
            console.log(String(myAct) + myItems[i].value + " should be green");
            this.page.addCss("#" + String(myAct) + myItems[i].value + "{background-color:#5db64e;}");
            }else{
            console.log(String(myAct) + myItems[i].value + " should be grey");
            this.page.addCss("#" + String(myAct) + myItems[i].value + "{background-color:transparent;}");
            };
        };

        //Set day as complete if done

       //Loop through all activities

        actloop: for(var act = 0; act < this.activities.length; act++){

            //Loop through internal list of activities

            for(var i=0; i < this.activities[act].length; i++){
                if(this.activities[act][i].totalPts == null){ 
                    console.log("-------BREAK POINT-------")
                    this.dayIsDone = false;
                    break actloop;
                } else {
                    this.dayIsDone = true;
                }
            }
            
            
        };
    
    };


    /**
     * Kill current activity list so that new data can be pulled, and get rid of css
     */
    clearCurrentState(){
        this.activities.forEach((activity) => {
            
            activity.forEach(element => {

                element.choices.forEach(choice => {
                    this.page.addCss('#' + element.id + choice.value + '{background-color: transparent}');
                });
            });
          
        });

        this.activities.forEach(category => {
            category.forEach(activity => {
                activity.totalPts = null;      
            });
        });


    }

    logout(){
        
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
    }

    saveTest(){
        this.api.saveToken("THIS IS MY NEW TEST");
        console.log('setting value....');
    }

    getTest(){
        console.log('getting value....');
        this.api.getToken();
    }

    clearTest(){
        console.log('clearing all values....');
        this.api.clearToken();
    }

    checkHtml(){
        console.log(this.myhtml);
    }

    switchDay(n: number){
        this.today += n;
        this.dayIsDone = this.days[this.today].isDone;
        this.clearCurrentState();
        this.getData(/*today*/);
    }

}