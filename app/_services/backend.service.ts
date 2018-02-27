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
export class BackendService {
    public Server = 'http://192.168.0.95:3000/';
    public ApiUrl = 'app/api/wellness/';
    public actionUrl = this.Server + this.ApiUrl;

    private postOptions: any = {
        headers: new HttpHeaders().set('Content-Type', 'application/json')
    };

    // set Authorization header and content type for for requests. Ignore Authorization when in prod
    private authHeaders: any = {
        headers: isDevMode() ? new HttpHeaders().set('Authorization','Basic dGVzdFVzZXI6cTF3MmUzcjQh')
            .set('Content-Type', 'application/json') :
            new HttpHeaders().set('Content-Type', 'application/json')};

    constructor(private http: HttpClient){}



    // Methods

    postActivity(myAct: Activity){
        return this.http.post(this.actionUrl + 'apiUrl', JSON.stringify(myAct), this.authHeaders);
    }

    getCategories(){
        return this.http.get('http://192.168.0.195:3000/app/api/wellness/activitiesRepository');
    }

    getPoints(user, day){
        return this.http.get(this.actionUrl + 'points/:' + user + '/:' + day );
    }

    saveToken(token){
        setString('auth', token);
    }

    getToken(){
        var myToken = getString('auth');
        console.log(myToken);
    }

    clearToken(){
        clear();
    }
    
}