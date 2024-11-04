import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Injectable, Injector } from '@angular/core';


@Component({
    selector: 'app-navbar-nolog',
    templateUrl: './navbar-nolog.component.html',
    styleUrls: ['./navbar-nolog.component.scss']
})

@Injectable()
export class NavbarComponentNolog{

    toggleClass = 'ft-maximize';


    constructor(public translate: TranslateService) {
      /*this.translate.use('en');
      sessionStorage.setItem('lang', 'en');*/
    }



}
