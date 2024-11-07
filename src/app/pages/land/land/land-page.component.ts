import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';


@Component({
    selector: 'app-land-page',
    templateUrl: './land-page.component.html',
    styleUrls: ['./land-page.component.scss'],
})

export class LandPageComponent {

    constructor(public translate: TranslateService, private router: Router) {
    }

    navigateToLogin() {
        this.router.navigate(['/login']);
    }


}
