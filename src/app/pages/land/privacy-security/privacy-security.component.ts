import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-privacy-security',
    templateUrl: './privacy-security.component.html',
    styleUrls: ['./privacy-security.component.scss']
})

export class PrivacySecurityPageComponent {
  constructor(public translate: TranslateService) {
    setTimeout(function () {
      this.goTo('initpos');
    }.bind(this), 300);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }
}
