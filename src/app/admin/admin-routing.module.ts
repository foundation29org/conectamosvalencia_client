import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { UsersAdminComponent } from "./users-admin/users-admin.component";
import { MapaPageComponent2 } from './mapa/mapa.component';
import { MyResourcesComponent } from './myresources/myresources.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        component: UsersAdminComponent,
        data: {
          title: 'Todos los recursos',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'mapa',
        component: MapaPageComponent2,
        data: {
          title: 'Mapa de calor'
        }
      },
      {
        path: 'myresources',
        component: MyResourcesComponent,
        data: {
          title: 'Mis recursos'
        }
      }      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
