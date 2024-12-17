import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import { catchError, tap } from 'rxjs/operators'
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class AuthService {

  private redirectUrl: string = '/home';
  private isloggedIn: boolean = false;
  private message: string;
  private iduser: string;
  private role: string;
  private lastError: any = null;

  constructor(private http: HttpClient, private router: Router, private modalService: NgbModal) {}

  checkAuthStatus(): Observable<boolean> {
    return this.http.get(`${environment.api}/api/me`, {
        withCredentials: true
    }).pipe(
        tap((response: any) => {
            //console.log('Auth status response:', response);
            if (response && response.sub) { // Verificar que la respuesta contiene datos de usuario
                this.isloggedIn = true;
                this.setUserInfo(response); // response ya es el userInfo
            } else {
                this.isloggedIn = false;
            }
        }),
        map(response => this.isloggedIn),
        catchError((error) => {
          console.log('Auth check failed');
          this.lastError = error; // Guardar el error
          this.isloggedIn = false;
          return of(false);
        })
    );
}

getLastError(): any {
  return this.lastError;
}

getEnvironment(): boolean {
  // Hacer una llamada asíncrona para verificar la autenticación
  this.checkAuthStatus().subscribe(
      isAuthenticated => {
          this.isloggedIn = isAuthenticated;
      }
  );
  return this.isloggedIn;
}

  /*login(formValue: any): Observable<boolean> {
    //your code for signing up the new user
    return this.http.post(environment.api+'/api/login',formValue)
    .pipe(
      tap((res: any) => {
        console.log(res);
        var msg = "";
        this.isloggedIn = true;
        return res; 
          if(res.message == "Check email"){
            var msg = "";
            this.isloggedIn = true;
            return res; 
          }else{
            this.isloggedIn = false;
            this.setMessage(res.message);
            return res; 
          }
        }),
        catchError((err) => {
          console.log(err);
          //this.isLoginFailed = true;
          this.setMessage("Si existe una cuenta asociada, recibirá un correo con el enlace de inicio de sesión.");
          this.isloggedIn = false;
          return of(this.isloggedIn); // aquí devuelves un observable que emite this.isloggedIn en caso de error
        })
      );
  }*/


  checkLogin(formValue: any): Observable<any> {
    return this.http.post(environment.api + '/api/checkLogin', formValue, {
        withCredentials: true,
        observe: 'response'
    }).pipe(
        switchMap((res: any) => {
            if (res.body.success && res.body.message === "You have successfully logged in") {
                this.setMessage(res.body.message);
                return this.getUserInfo().pipe(
                    tap(userInfo => {
                        console.log('Setting user info:', userInfo);
                        this.isloggedIn = true;
                        this.setUserInfo(userInfo);
                    }),
                    map(() => true) // Cambiamos para retornar true explícitamente
                );
            }
            return of(false);
        }),
        catchError(err => {
            console.error('Login error:', err);
            this.setMessage("Si existe una cuenta asociada, recibirá un correo con el enlace de inicio de sesión.");
            this.isloggedIn = false;
            return of(false);
        })
    );
}

  getUserInfo(): Observable<any> {
    return this.http.get(`${environment.api}/api/me`, {
        withCredentials: true
    }).pipe(
        tap(response => console.log('User info response:', response)),
        catchError(error => {
            console.error('Error getting user info:', error);
            return throwError(error);
        })
    );
}

private setUserInfo(userInfo: any) {
  // Ahora usamos directamente userInfo ya que la respuesta ya contiene los datos
  this.iduser = userInfo.sub;
  this.role = userInfo.role;

  // Establecer redirección según el rol
  if (this.role === 'SuperAdmin') {
      this.setRedirectUrl('/superadmin/users');
  } else if (this.role === 'User') {
      this.setRedirectUrl('/user/myresources');
  } else if (this.role === 'Admin') {
      this.setRedirectUrl('/admin/resources');
  }
}

  logout() {
    return this.http.post(environment.api + '/api/logout', {}, {
        withCredentials: true
    }).pipe(
        tap(() => {

          this.modalService.dismissAll();
            // Limpiar el estado
            this.isloggedIn = false;
            this.role = null;
            this.setIdUser(null);
            sessionStorage.clear();
            this.router.navigate(['/login'], { replaceUrl: true });
        }),
        catchError(error => {
            console.error('Logout error:', error);
            // En caso de error, forzar la limpieza y redirección
            this.isloggedIn = false;
            this.role = null;
            this.setIdUser(null);
            this.modalService.dismissAll();
            sessionStorage.clear();
            this.router.navigate(['/login']);
            return throwError(error);
        })
    );
}

  isAuthenticated(): boolean {
    if (!this.isloggedIn) {
      return false;
    }
    return true;
  }

  getRedirectUrl(): string {
		const savedUrl = sessionStorage.getItem('redirectUrl');
    return savedUrl || this.redirectUrl || '/home';
	}
	setRedirectUrl(url: string): void {
		this.redirectUrl = url;
    sessionStorage.setItem('redirectUrl', url);
	}
  setMessage(message: string): void {
		this.message = message;
	}
  getMessage(): string {
		return this.message;
	}
  setRole(role: string): void {
    this.role = role;
  }
  getRole(): string {
    return this.role;
  }

  setIdUser(iduser: string): void {
    this.iduser = iduser;
  }
  getIdUser(): string {
    return this.iduser;
  }


}
