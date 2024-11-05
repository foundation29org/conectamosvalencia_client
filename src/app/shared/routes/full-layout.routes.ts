import { Routes, RouterModule } from '@angular/router';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

//Route for content layout with sidebar, navbar and footer
export const Full_ROUTES: Routes = [
  {
    path: 'user',
    loadChildren: () => import('../../user/user.module').then(m => m.UserModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['User', 'Admin', 'SuperAdmin'] }
  },
  {
    path: 'admin',
    loadChildren: () => import('../../admin/admin.module').then(m => m.AdminModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['Admin', 'SuperAdmin'] }
  },
  {
    path: 'superadmin',
    loadChildren: () => import('../../superadmin/superadmin.module').then(m => m.SuperAdminModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['Admin', 'SuperAdmin'] }
  },
  {
    path: 'pages',
    loadChildren: () => import('../../pages/full-pages/full-pages.module').then(m => m.FullPagesModule)
  }
];
