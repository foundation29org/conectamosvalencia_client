import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private router: Router
  ) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.authService.setRedirectUrl(state.url);
    return this.authService.checkAuthStatus().pipe(
        tap(isValid => {
            if (!isValid) {
                console.log('Auth check failed');
                this.handleAuthError();
                this.router.navigate(['/login']);
            }
        }),
        map(isValid => {
            if (isValid) {
                const expectedRole = route.data['expectedRole'];
                const userRole = this.authService.getRole();
                
                if (expectedRole && (!userRole || !expectedRole.includes(userRole))) {
                    this.handleUnauthorized();
                    return false;
                }
                return true;
            }
            return false;
        })
    );
}

private handleAuthError() {
    this.toastr.error('', this.translate.instant("generics.error try again"));
}

private handleUnauthorized() {
    this.toastr.error('', this.translate.instant("generics.not authorized"));
}
}
