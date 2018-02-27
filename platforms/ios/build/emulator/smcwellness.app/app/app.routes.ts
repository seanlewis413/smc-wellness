import { EntryPageComponent } from "./entrypage/entrypage.component";
import {   LoginComponent   } from './login/login.component';

export const routes = [
    { path: "", redirectTo: "/login", pathMatch: "full" },
    { path: "login", component: LoginComponent },
    { path: "main", component: EntryPageComponent }
];