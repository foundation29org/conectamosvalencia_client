import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-cookies',
    templateUrl: './cookies.component.html',
    styleUrls: ['./cookies.component.scss']
})

export class CookiesPageComponent {
  constructor(public translate: TranslateService) {
    setTimeout(function () {
      this.goTo('initpos');
    }.bind(this), 300);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }
}
