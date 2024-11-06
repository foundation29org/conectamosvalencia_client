import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/pages/login']);
      return false;
    }

    const expectedRoles = route.data['expectedRole'];
    const userRole = this.authService.getRole();

    if (!expectedRoles || !userRole || !expectedRoles.includes(userRole)) {
      // Redirigir según el rol del usuario
      switch(userRole) {
        case 'User':
          this.router.navigate(['/user/myresources']);
          break;
        case 'Admin':
          this.router.navigate(['/admin/resources']);
          break;
        case 'SuperAdmin':
          this.router.navigate(['/superadmin/users']);
          break;
        default:
          this.router.navigate(['/pages/login']);
      }
      return false;
    }

    return true;
  }
}