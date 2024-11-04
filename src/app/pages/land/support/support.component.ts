import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-support',
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.scss']
})

export class SupportPageComponent {
  currentYear: number = new Date().getFullYear();
  constructor(public translate: TranslateService) {
    setTimeout(function () {
      this.goTo('initpos');
    }.bind(this), 300);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }
}
