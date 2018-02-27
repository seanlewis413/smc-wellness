import { Component, OnInit, Injectable, Input } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { Page } from 'tns-core-modules/ui/page/page';
import { EventData } from 'data/observable';
import { Observable, Frame } from 'tns-core-modules/ui/frame/frame';
import { BackendService, StateService } from '../_services/index.service';
import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { GestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { Router, ActivatedRoute } from "@angular/router";

@Component({
    selector: "my-app",
    moduleId: module.id,
    templateUrl: "./login.component.html",                 
    styleUrls: ["login.component.css", "../app.css"],
    providers:[BackendService, StateService]
  })

export class LoginComponent{

    user: string = '';
    password: string = '';

    users=[
        {userName: 'Sean', password: 'smc' },
        {userName: 'smc',  password: 'test'},
        {userName: '',     password:     ''},
        {userName: 'Usamah', password: ''}
    ]

    constructor(
        private api: BackendService,
        private page: Page,
        private route: ActivatedRoute,
        private router: Router,
        private savedData: StateService){}

    signIn(){
        for (let i = 0; i < this.users.length; i++){
            if(this.users[i].userName == this.user && this.users[i].password == this.password){
                console.log(`${this.user} successfully logging in with password ${this.password}`);

                this.savedData.saveUser(this.user);
                this.savedData.saveSignIn();

                this.router.navigate(['/main']);
                break;
            }else{
                console.log(`${this.user} user not found...`);
            };
        };
        
    };
};