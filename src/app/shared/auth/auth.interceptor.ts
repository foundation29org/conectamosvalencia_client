import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { environment } from 'environments/environment';

import { EventsService } from 'app/shared/services/events.service';
import { takeUntil } from 'rxjs/operators';
import * as decode from 'jwt-decode';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private inj: Injector, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    var eventsService = this.inj.get(EventsService);
    let authService = this.inj.get(AuthService);

    var isExternalReq = false;

    if (req.url.startsWith(environment.api)) {
      const authReq = req.clone({
        withCredentials: true,
        headers: req.headers
          .set('Accept', 'application/json')
      });

      return next.handle(authReq).pipe(
        tap(
          event => {
            if (event instanceof HttpResponse) {
              /*console.log('Response:', {
                url: event.url,
                status: event.status,
                headers: event.headers.keys()
              });*/
            }
          }
        ),
        catchError((error: any) => {
          console.log('Interceptor error:', error);

          if (error.status === 401) {
            // No autorizado
            console.log('Unauthorized error');
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
              eventsService.broadcast('http-error', returnMessage);
            } else {
              eventsService.broadcast('http-error-external', 'no external conexion');
            }
          }

          return throwError(error);
        })
      );
    }
    
    return next.handle(req);
  }
}
