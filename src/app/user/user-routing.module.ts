import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { MyResourcesComponent } from './myresources/myresources.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'myresources',
        component: MyResourcesComponent,
        data: {
          title: 'Mis recursos',
          expectedRole: ['User', 'Admin', 'SuperAdmin']
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
export class UserRoutingModule { }
