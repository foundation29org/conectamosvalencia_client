import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

import { SuperAdminRoutingModule } from "./superadmin-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from "../shared/directives/match-height.directive";
import { UiSwitchModule } from 'ngx-ui-switch';

import { UsersAdminComponent } from "./users-admin/users-admin.component";
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {AutosizeModule} from 'ngx-autosize';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        SuperAdminRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        FormsModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        UiSwitchModule,
        NgxDatatableModule,
        AutosizeModule,
        MatCardModule,
        MatRadioModule,
        MatCheckboxModule,
        MatTooltipModule,
        NgbPopoverModule,
        ReactiveFormsModule
    ],
    exports: [TranslateModule],
    declarations: [
        UsersAdminComponent
    ],
    providers: [],
})
export class SuperAdminModule { }
