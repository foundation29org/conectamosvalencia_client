import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { FullPagesRoutingModule } from "./full-pages-routing.module";
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {AutosizeModule} from 'ngx-autosize';
import { UiSwitchModule } from 'ngx-ui-switch';


@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        FullPagesRoutingModule,
        FormsModule,
        NgbModule,
        TranslateModule,
        CustomFormsModule,
        AutosizeModule,
        UiSwitchModule
    ],
    declarations: [
    ]
})
export class FullPagesModule { }
