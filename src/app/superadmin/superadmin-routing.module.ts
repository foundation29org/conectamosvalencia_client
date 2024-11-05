import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { UsersAdminComponent } from "./users-admin/users-admin.component";
import { ResourcesComponent } from "./resources/resources.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        component: UsersAdminComponent,
        data: {
          title: 'Users',
          expectedRole: ['SuperAdmin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'resources',
        component: ResourcesComponent,
        data: {
          title: 'Resources',
          expectedRole: ['SuperAdmin']
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
export class SuperAdminRoutingModule { }
