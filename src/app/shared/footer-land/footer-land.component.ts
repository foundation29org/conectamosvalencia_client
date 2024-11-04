import { TranslateService } from '@ngx-translate/core';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-footer-land',
    templateUrl: './footer-land.component.html',
    styleUrls: ['./footer-land.component.scss']
})

export class FooterLandComponent implements OnDestroy{
    private subscription: Subscription = new Subscription();

    constructor(public translate: TranslateService) {
    }


      ngOnDestroy() {
        this.subscription.unsubscribe();
      }
      
  

}
