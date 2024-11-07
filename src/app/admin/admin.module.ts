import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from "./admin-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from "../shared/directives/match-height.directive";
import { UiSwitchModule } from 'ngx-ui-switch';
import { AgmCoreModule } from '@agm/core';

import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {AutosizeModule} from 'ngx-autosize';
import { SafePipe } from '../shared/services/safe.pipe';
import { MapaPageComponent2 } from './mapa/mapa.component';
import { ResourcesComponent } from './resources/resources.component';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { MatFormFieldModule } from '@angular/material/form-field'

@NgModule({
    imports: [
        CommonModule,
        AdminRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        UiSwitchModule,
        AgmCoreModule.forRoot({
            apiKey: "AIzaSyAcbDF_C9btRGAUWSePhOR4UxsVbtK3cJA",
            language: 'es'
          }),
        NgxDatatableModule,
        AutosizeModule,
        MatCardModule,
        MatRadioModule,
        MatCheckboxModule,
        MatTooltipModule,
        NgbPopoverModule,
        MatFormFieldModule
    ],
    exports: [TranslateModule],
    declarations: [
        SafePipe,
        MapaPageComponent2,
        ResourcesComponent
    ],
    providers: [],
})
export class AdminModule { }
