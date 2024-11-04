import { Component, OnInit, Input, ViewChild, OnDestroy, ElementRef, Renderer2, AfterViewInit } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { ROUTES, ROUTESSUPERADMIN, ROUTESCLINICAL, ROUTESHOMEDX, ROUTESADMINGTP} from './sidebar-routes.config';
import { RouteInfo } from "./sidebar.metadata";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { customAnimations } from "../animations/custom-animations";
import { ConfigService } from '../services/config.service';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'app/shared/auth/auth.service';
import { EventsService} from 'app/shared/services/events.service';
import { Data } from 'app/shared/services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  animations: customAnimations
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('toggleIcon') toggleIcon: ElementRef;
  public menuItems: any[];
  depth: number;
  activeTitle: string;
  activeTitles: string[] = [];
  expanded: boolean;
  nav_collapsed_open = false;
  logoUrl = 'assets/img/logo.png';
  public config: any = {};
  layoutSub: Subscription;
  urlLogo: string = 'assets/img/logo-ayudamosvalencia.png';
  urlLogo2: string = 'assets/img/logo-ayudamosvalencia.png';
  redirectUrl: string = '';
  isHomePage: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService,
    private configService: ConfigService,
    private layoutService: LayoutService,
    private authService: AuthService,
    private eventsService: EventsService,
     private dataservice: Data,
     private http: HttpClient
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
      this.expanded = true;
    }
    this.layoutSub = layoutService.customizerChangeEmitted$.subscribe(
      options => {
        if (options) {
          if (options.bgColor) {
            if (options.bgColor === 'white') {
              this.logoUrl = 'assets/img/logo-dark.png';
            }
            else {
              this.logoUrl = 'assets/img/logo.png';
            }
          }
          if (options.compactMenu === true) {
            this.expanded = false;
            this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
            this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
            this.nav_collapsed_open = true;
          }
          else if (options.compactMenu === false) {
            this.expanded = true;
            this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
            this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
            this.nav_collapsed_open = false;
          }

        }
      });


    this.redirectUrl = this.authService.getRedirectUrl();


    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl= (event.url).toString().split('?');
        var actualUrl = tempUrl[0];
        var tempUrl1 = (actualUrl).toString();
        if(tempUrl1.indexOf('/home')!=-1){
          this.isHomePage = true;
        }else{
          this.isHomePage = false;
        }
        if(this.authService.getRole() == 'SuperAdmin'){
          //cargar menú del Admin
          this.menuItems = ROUTESSUPERADMIN.filter(menuItem => menuItem);
        }else if(this.authService.getRole() == 'Clinical'){
          //cargar menú del Clinical
          this.menuItems = ROUTESCLINICAL.filter(menuItem => menuItem);
        }
        else if(this.authService.getRole() == 'Admin'){
          if(this.authService.getSubRole() == 'AdminGTP'){
            this.menuItems = ROUTESADMINGTP.filter(menuItem => menuItem);
          }
        }else if(this.authService.getRole() == undefined){
          this.menuItems = ROUTESHOMEDX.filter(menuItem => menuItem);
        }
      }
    );
  }


  ngOnInit() {
    this.config = this.configService.templateConf;
    if(this.authService.getRole() == 'SuperAdmin'){
      //cargar menú del Admin
      this.menuItems = ROUTESSUPERADMIN.filter(menuItem => menuItem);
    }else if(this.authService.getRole() == 'Clinical'){
      //cargar menú del Clinical
      this.menuItems = ROUTESCLINICAL.filter(menuItem => menuItem);
    }
    else if(this.authService.getRole() == 'Admin'){
      if(this.authService.getSubRole() == 'AdminGTP'){
        this.menuItems = ROUTESADMINGTP.filter(menuItem => menuItem);
      }
    }else if(this.authService.getRole() == undefined){
      this.menuItems = ROUTESHOMEDX.filter(menuItem => menuItem);
    }
    if (this.config.layout.sidebar.backgroundColor === 'white') {
      this.logoUrl = 'assets/img/logo-dark.png';
    }
    else {
      this.logoUrl = 'assets/img/logo.png';
    }
  }

  ngAfterViewInit() {

    setTimeout(() => {
      if (this.config.layout.sidebar.collapsed != undefined) {
        if (this.config.layout.sidebar.collapsed === true) {
          this.expanded = false;
          this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
          this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
          this.nav_collapsed_open = true;
        }
        else if (this.config.layout.sidebar.collapsed === false) {
          this.expanded = true;
          this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
          this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
          this.nav_collapsed_open = false;
        }
      }
    }, 0);


  }

  ngOnDestroy() {
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  toggleSlideInOut() {
    this.expanded = !this.expanded;
  }

  handleToggle(titles) {
    this.activeTitles = titles;
  }

  // NGX Wizard - skip url change
  ngxWizardFunction(path: string) {
    if (path.indexOf("forms/ngx") !== -1)
      this.router.navigate(["forms/ngx/wizard"], { skipLocationChange: false });
  }

}
