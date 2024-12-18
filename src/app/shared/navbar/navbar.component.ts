import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LayoutService } from '../services/layout.service';
import { ConfigService } from '../services/config.service';

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
  redirectUrl: string = '';
  actualUrl: string = '';
  role: string = 'User';
  isHomePage: boolean = false;

  constructor(public translate: TranslateService, private layoutService: LayoutService, private configService: ConfigService, private authService: AuthService, private router: Router) {

    this.role = this.authService.getRole();
    this.redirectUrl = this.authService.getRedirectUrl();

    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(
      event => {
        var tempUrl = (event.url).toString().split('?');
        this.actualUrl = tempUrl[0];
        var tempUrl1 = (this.actualUrl).toString();
        if (tempUrl1.indexOf('/home') != -1) {
          this.isHomePage = true;
        } else {
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
    this.authService.logout().subscribe(
        () => {
            console.log('Logout successful');
            // La navegación ya está manejada en el AuthService
        },
        error => {
            console.error('Logout error:', error);
            // Manejar el error si es necesario
            this.router.navigate(['/login']);
        }
    );
}

}
