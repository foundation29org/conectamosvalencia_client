import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'app/shared/auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import {  NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';

import { LayoutService } from '../services/layout.service';
import { ConfigService } from '../services/config.service';

declare var device;
declare global {
  interface Navigator {
    app: {
      exitApp: () => any; // Or whatever is the type of the exitApp function
    }
  }
}

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"]
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  toggleClass = "ft-maximize";
  placement = "bottom-right";
  public isCollapsed = true;
  layoutSub: Subscription;
  @Output()
  toggleHideSidebar = new EventEmitter<Object>();

  public config: any = {};

  isApp: boolean = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  isAndroid: boolean = false;
  patients: any;
  currentPatient: any = {};
  redirectUrl: string = '';
  actualUrl: string = '';
  email: string = '';
  role: string = 'User';
  roleShare: string = 'Clinical';
  modalReference: NgbModalRef;
  @ViewChild('f') sendForm: NgForm;
  sending: boolean = false;
  revonking: boolean = false;
  listOfSharingAccounts: any = [];
  permissions: any = {};
  selectedPatient: any = {};
  shareWithObject: any = {};
  isMine: boolean = false;
  message: string = '';
  indexPermissions: number = -1;
  loading: boolean = true;
  myUserId: string = '';
  myEmail: string = '';
  isHomePage: boolean = false;
  isClinicalPage: boolean = false;
  age: any = {};
  private subscription: Subscription = new Subscription();

  constructor(public translate: TranslateService, private layoutService: LayoutService, private configService: ConfigService, private authService: AuthService, private router: Router) {
    if (this.isApp) {
      if (device.platform == 'android' || device.platform == 'Android') {
        this.isAndroid = true;
      }
    }

    this.role = this.authService.getRole();
    console.log(this.role);
    this.redirectUrl = this.authService.getRedirectUrl();

    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(
      event => {
        var tempUrl = (event.url).toString().split('?');
        this.actualUrl = tempUrl[0];
        var tempUrl1 = (this.actualUrl).toString();
        if (tempUrl1.indexOf('/home') != -1) {
          this.isHomePage = true;
          this.isClinicalPage = false;
        } else {
          if (tempUrl1.indexOf('/clinical/diagnosis') != -1) {
            this.isClinicalPage = true;
          } else {
            this.isClinicalPage = false;
          }
          this.isHomePage = false;
        }

      }
    );

    this.layoutSub = layoutService.changeEmitted$.subscribe(
      direction => {
        const dir = direction.direction;
        if (dir === "rtl") {
          this.placement = "bottom-left";
        } else if (dir === "ltr") {
          this.placement = "bottom-right";
        }
      });

  }

  ngOnInit() {
    this.config = this.configService.templateConf;
  }

  ngAfterViewInit() {
    if (this.config.layout.dir) {
      const dir = this.config.layout.dir;
      if (dir === "rtl") {
        this.placement = "bottom-left";
      } else if (dir === "ltr") {
        this.placement = "bottom-right";
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  ToggleClass() {
    if (this.toggleClass === "ft-maximize") {
      this.toggleClass = "ft-minimize";
    } else {
      this.toggleClass = "ft-maximize";
    }
  }

  toggleNotificationSidebar() {
    this.layoutService.emitChange(true);
  }

  toggleSidebar() {
    const appSidebar = document.getElementsByClassName("app-sidebar")[0];
    if (appSidebar.classList.contains("hide-sidebar")) {
      this.toggleHideSidebar.emit(false);
    } else {
      this.toggleHideSidebar.emit(true);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate([this.authService.getLoginUrl()]);
  }

  exit() {
    navigator.app.exitApp();
  }

}
