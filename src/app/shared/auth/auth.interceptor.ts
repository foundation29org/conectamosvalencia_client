import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch';

import { AuthService } from './auth.service';
import { environment } from 'environments/environment';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private inj: Injector, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authService = this.inj.get(AuthService);

    var isExternalReq = false;

    if (req.url.startsWith(environment.api)) {
      const authReq = req.clone({
        withCredentials: true,
        headers: req.headers
          .set('Accept', 'application/json')
      });

      return next.handle(authReq).pipe(
        catchError((error: any) => {
          console.log('Interceptor error:', error);
          if (req.url.endsWith('/api/me')) {
            return throwError(error);
          }
          if (error.status === 401) {
            console.log('Unauthorized error:', error.error);
            if (error.error?.message === 'Token expired') {
              console.log('Token expired - logging out');
              error.handled = true;
              if (Swal.isVisible()) {
                console.log('Hay un Swal abierto, cerrándolo...');
                Swal.close();
                // Pequeño delay para asegurar que el Swal anterior se cierre
                setTimeout(() => {
                    this.showSessionExpiredAlert(authService);
                }, 200);
              } else {
                  this.showSessionExpiredAlert(authService);
              }
              
            }else if (error.error?.message === 'Invalid token') {
              console.log('Invalid token - logging out');
              authService.logout().subscribe(
                () => {
                  console.log('Logout successful after Invalid token');
                  this.router.navigate(['/login']);
                }
              );
            }
            return throwError(error);
          }

          if (error.status === 403) {
            // Forbidden - hacer logout
            console.log('Forbidden error - logging out');
            authService.logout().subscribe(
              () => console.log('Logout successful after 403'),
              err => console.error('Error during logout after 403:', err)
            );
            return throwError(error);
          }

          if (error.status === 404 || error.status === 0) {
            if (!isExternalReq) {
              const returnMessage = error.error?.message || error.message;
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: returnMessage
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión externa'
              });
            }
          }

          return throwError(error);
        })
      );
    }
    
    return next.handle(req);
  }
  private showSessionExpiredAlert(authService: AuthService): void {
    Swal.fire({
        title: 'Atención',
        text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
    }).then((result) => {
        authService.logout().subscribe(
            () => {
                console.log('Logout successful after token expiration');
                this.router.navigate(['/login']);
            },
            err => {
                console.error('Error during logout after token expiration:', err);
                this.router.navigate(['/login']);
            }
        );
    });
  }
}
