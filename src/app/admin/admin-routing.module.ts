import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { MapaPageComponent2 } from './mapa/mapa.component';
import { ResourcesComponent } from '../admin/resources/resources.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'mapa',
        component: MapaPageComponent2,
        data: {
          title: 'Mapa de calor',
          expectedRole: ['Admin', 'SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'resources',
        component: ResourcesComponent,
        data: {
          title: 'Recursos',
          expectedRole: ['Admin', 'SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      }     
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
