import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as decode from 'jwt-decode';
import { ICurrentPatient } from './ICurrentPatient.interface';
import { catchError, tap } from 'rxjs/operators'
import { of } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable()
export class AuthService {
  private token: string;
  private loginUrl: string = '/.';
  private redirectUrl: string = '/home';
  private isloggedIn: boolean = false;
  private message: string;
  private iduser: string;
  private role: string;
  private subrole: string;
  private group: string;
  private lang: string;
  private platform: string;
  private expToken: number = null;
  private currentPatient: ICurrentPatient = null;
  private patientList: Array<ICurrentPatient> = null;

  private isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

  constructor(private http: HttpClient) {}


  getEnvironment():boolean{
    if(sessionStorage.getItem('token')){
      this.setLang(sessionStorage.getItem('lang'));
      if(sessionStorage.getItem('lang')=='es'){
        sessionStorage.setItem('culture', 'es-ES');
      }else{
        sessionStorage.setItem('culture', 'en-EN');
      }
      this.setAuthenticated(sessionStorage.getItem('token'));
      const tokenPayload = decode(sessionStorage.getItem('token'));
      this.setIdUser(tokenPayload.sub);
      this.setExpToken(tokenPayload.exp);
      this.setRole(tokenPayload.role);
      this.setSubRole(tokenPayload.subrole);

      if(tokenPayload.role == 'SuperAdmin'){
        // is role superadmin
        this.setRedirectUrl('/superadmin/users')
      }else if(tokenPayload.role == 'Clinical'){
        // is role Clinical
        this.setRedirectUrl('/clinical/home')
      }else if(tokenPayload.role == 'Admin'){
        // Admin
        this.setGroup(tokenPayload.group);
        this.setRedirectUrl('/admin/users')
      }
      else{
        // is role user
        this.setRedirectUrl('/home')

      }
      //this.setGroup(tokenPayload.group);

      this.setPlatform(sessionStorage.getItem('platform'));

      return true;
    }else{
      return false;
    }
  }

  setEnvironment(token:string):void{
    this.setAuthenticated(token);
    // decode the token to get its payload
    const tokenPayload = decode(token);
    this.setIdUser(tokenPayload.sub);
    this.setExpToken(tokenPayload.exp);
    this.setRole(tokenPayload.role);
    this.setSubRole(tokenPayload.subrole);
    if(tokenPayload.role == 'SuperAdmin'){
      // is role superadmin
      this.setRedirectUrl('/superadmin/users')
    }else if(tokenPayload.role == 'Clinical'){
      // is role clinic
      this.setRedirectUrl('/clinical/home')
    }else if(tokenPayload.role == 'Admin'){
      // Admin
      this.setGroup(tokenPayload.group);
      this.setRedirectUrl('/admin/users')
    }else{
      // is role user
      this.setRedirectUrl('/home')
    }
    //this.setGroup(tokenPayload.group);
    //save sessionStorage
    sessionStorage.setItem('token', token)
  }

  login(formValue: any): Observable<boolean> {
    //your code for signing up the new user
    return this.http.post(environment.api+'/api/login',formValue)
    .pipe(
      tap((res: any) => {
        console.log(res);
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
          this.setMessage("Login failed");
          this.isloggedIn = false;
          return of(this.isloggedIn); // aquí devuelves un observable que emite this.isloggedIn en caso de error
        })
      );
  }

  checkLogin(formValue: any): Observable<boolean> {
    //your code for signing up the new user
    return this.http.post(environment.api+'/api/checkLogin',formValue)
    .pipe(
      tap((res: any) => {
          if(res.message == "You have successfully logged in"){
            this.setEnvironment(res.token);
          }else if(res.message == "Link expired"){
            this.isloggedIn = false;
            Swal.fire({
              title: 'El enlace de acceso ha expirado',
              html: '<p class="mt-2">Lo sentimos, el enlace para acceder a tu cuenta ha expirado por motivos de seguridad. Por favor, vuelve a introducir tu email.</p>',
              icon: 'error',
              showCancelButton: false,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Ok'
            }).then((result) => {
            })
          }else{
            this.isloggedIn = false;
          }
          this.setMessage(res.message);
          return this.isloggedIn;
        }),
        catchError((err) => {
          console.log(err);
          //this.isLoginFailed = true;
          this.setMessage("Login failed");
          this.isloggedIn = false;
          return of(this.isloggedIn); // aquí devuelves un observable que emite this.isloggedIn en caso de error
        })
      );
  }

  logout() {
    this.token = null;
    this.role = null;
    this.subrole = null;
    this.group = null;
    this.platform = null;
    this.expToken = null;
    this.isloggedIn = false;
    this.message = null;
    this.currentPatient = null;
    this.patientList = null;
    this.lang = sessionStorage.getItem('lang');
    //if(!this.getIsApp()){
      sessionStorage.clear();
      sessionStorage.setItem('lang', this.lang);
    //}
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    // here you can check if user is authenticated or not through his token
    return this.isloggedIn;
  }
  //este metodo sobraría si se usa el metodo signinUser
  setAuthenticated(token) {
    // here you can check if user is authenticated or not through his token
    this.isloggedIn=true;
    this.token=token;
  }
  getLoginUrl(): string {
		return this.loginUrl;
	}
  getRedirectUrl(): string {
		return this.redirectUrl;
	}
	setRedirectUrl(url: string): void {
		this.redirectUrl = url;
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
  setSubRole(subrole: string): void {
    this.subrole = subrole;
  }
  getSubRole(): string {
    return this.subrole;
  }
  setGroup(group: string): void {
    this.group = group;
  }
  getGroup(): string {
    return this.group;
  }
  setExpToken(expToken: number): void {
    this.expToken = expToken;
  }
  getExpToken(): number {
    return this.expToken;
  }
  setIdUser(iduser: string): void {
    this.iduser = iduser;
  }
  getIdUser(): string {
    return this.iduser;
  }
  setCurrentPatient(currentPatient: ICurrentPatient): void {
    this.currentPatient = currentPatient;
  }
  getCurrentPatient(): ICurrentPatient {
    return this.currentPatient;
  }
  setPatientList(patientList: Array<ICurrentPatient>): void {
    this.patientList = patientList;
  }
  getPatientList(): Array<ICurrentPatient> {
    return this.patientList;
  }
  setLang(lang: string): void {
    this.lang = lang;
    sessionStorage.setItem('lang', this.lang);
  }
  getLang(): string {
    return this.lang;
  }

  setPlatform(platform: string): void {
    this.platform = platform;
    sessionStorage.setItem('platform', this.platform);
  }
  getPlatform(): string {
    return this.platform = null;;
  }
  getIsApp(): boolean {
    return this.isApp;
  }

}
