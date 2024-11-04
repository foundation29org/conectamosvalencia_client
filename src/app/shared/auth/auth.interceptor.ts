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


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private inj: Injector, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    var eventsService = this.inj.get(EventsService);

    let authService = this.inj.get(AuthService); //authservice is an angular service
        // Get the auth header from the service.
    const Authorization = authService.getToken();
    if(authService.getToken()==undefined){
      const authReq = req.clone({ headers: req.headers});
      return next.handle(authReq)
    }
    // Clone the request to add the new header.
    var token =  authService.getToken();
    var type = 'Bearer'

    // Clone the request to add the new header.

    var isExternalReq = false;
    var authReq = req.clone({});

    if(req.url.indexOf(environment.api)!==-1){
      /*const headers = new HttpHeaders({
        'authorization': `${type} ${token}`,
        'Cache-Control':  'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      authReq = req.clone({ headers});*/
      authReq = req.clone({ headers: req.headers.set('authorization',  `${type} ${token}`) });
      let tokenService = this.inj.get(TokenService);
      if(!tokenService.isTokenValid()){
        authService.logout();
        this.router.navigate([authService.getLoginUrl()]);
      }
    }

    // Pass on the cloned request instead of the original request.
    return next.handle(authReq)
      .catch((error, caught) => {

        if (error.status === 401) {
          return Observable.throw(error);
        }

        if (error.status === 404 || error.status === 0) {
          if (!isExternalReq) {
            var returnMessage = error.message;
            if (error.error.message) {
              returnMessage = error.error;
            }
            //eventsService.broadcast('http-error', returnMessage);
          } else {
            //eventsService.broadcast('http-error-external', 'no external conexion');

          }
          return Observable.throw(error);
        }

        if (error.status === 419) {
          return Observable.throw(error);
        }

        //return all others errors
        return Observable.throw(error);
      }) as any;
  }
}
