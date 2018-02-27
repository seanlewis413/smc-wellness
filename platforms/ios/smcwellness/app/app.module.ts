import { NgModule, NO_ERRORS_SCHEMA, Component, OnInit } from "@angular/core";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptRouterModule} from "nativescript-angular/router";
import { routes } from './app.routes';
import { EntryPageComponent } from "./entrypage/entrypage.component";
import { HttpClientModule } from "@angular/common/http";
import { PagerModule } from "nativescript-pager/angular";
import { LoginComponent } from "./login/login.component";
import { Router, ActivatedRoute } from "@angular/router";
import { StateService, BackendService } from "./_services/index.service";

@Component({
  selector: "navigation-test",
  template: `
      <StackLayout>
          <router-outlet></router-outlet>
      </StackLayout>
  `,
  styleUrls: ["./login/login.component.css", "./entrypage/entrypage.component.css", "./app.css"],
  providers:[BackendService, StateService]  
})
export class NavigationAppComponent implements OnInit{

  isSignedIn: boolean;

  constructor(
    private api: BackendService,
    private savedData: StateService,
    private route: ActivatedRoute,
    private router: Router){}

  ngOnInit(){

    this.isSignedIn = this.savedData.getSignIn();
    if (this.isSignedIn){
      this.router.navigate(['/main']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}


@NgModule({
  declarations: [EntryPageComponent, NavigationAppComponent, LoginComponent],
  bootstrap: [NavigationAppComponent],
  imports: [NativeScriptModule, HttpClientModule, PagerModule, NativeScriptRouterModule, NativeScriptRouterModule.forRoot(routes), NativeScriptFormsModule],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [BackendService, StateService]
})
export class AppModule {}
