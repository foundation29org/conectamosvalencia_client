import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})

export class AboutPageComponent {
  constructor(public translate: TranslateService) {
    setTimeout(function () {
      this.goTo('initpos');
    }.bind(this), 300);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }
}
