import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-foundation',
    templateUrl: './foundation.component.html',
    styleUrls: ['./foundation.component.scss']
})

export class FoundationPageComponent {
  constructor(public translate: TranslateService) {
    setTimeout(function () {
      this.goTo('initpos');
    }.bind(this), 300);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }
}
