import 'rxjs/add/operator/map';

import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Activity } from "../_models/activity";
import {
    getBoolean,
    setBoolean,
    getNumber,
    setNumber,
    getString,
    setString,
    hasKey,
    remove,
    clear
} from "application-settings";


@Injectable()
export class StateService{
    constructor(){}

    saveUser(user){
        console.log("saving user " + user);
        setString('user', user);
    }

    saveSignIn(){
        console.log('setting signed in value...');
        setBoolean('isSignedIn', true);
    }

    getSignIn(){
        console.log("getting sign in status.....");
        return getBoolean('isSignedIn');
    }

    clearAll(){
        console.log('clearing values...');
        clear();
    }

    getUser(){
        var myUser = getString('user');
        return myUser;
    }



}