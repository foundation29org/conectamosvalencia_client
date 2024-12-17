import { Component, ViewChild, OnDestroy, OnInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from '../../../../app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss']
})

export class LoginPageComponent implements OnDestroy, OnInit{

    @ViewChild('f') loginForm: NgForm;
    sending: boolean = false;

    isLoginFailed: boolean = false;
    email: string;
    userEmail: string;
    patient: any;
    private subscription: Subscription = new Subscription();
    private subscriptionIntervals: Subscription = new Subscription();
    private subscriptionTestForce: Subscription = new Subscription();
    startTime: Date = null;
    finishTime: Date = null;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    haveToken: boolean = false;

    @ViewChild('recaptcha') recaptchaElement: ElementRef;
    captchaToken: string = "";
    needCaptcha: boolean = true;
    private lastSubmitTime: number = 0;
    private readonly THROTTLE_TIME_MS: number = 2000; // 2 segundos entre intentos

    constructor(private router: Router, public authService: AuthService, public translate: TranslateService, public toastr: ToastrService, private cdr: ChangeDetectorRef, private http: HttpClient) {
     }


  ngOnInit() {
    console.log('LoginPage Init');
    const urlParams = new URLSearchParams(window.location.search);
    const email = decodeURIComponent(urlParams.get('email') || '');
    const key = decodeURIComponent(urlParams.get('key') || '');
    
    if (email && key) {
        this.handleLoginWithEmailAndKey(email, key);
    } else {
        this.checkAuthentication();
    }

    this.addRecaptchaScript();
}

renderReCaptch() {
  this.needCaptcha = true;
  if(this.recaptchaElement==undefined){
      location.reload();
  }else{
      try{  
          const size = window.innerWidth < 400 ? 'compact' : 'normal';
          window['grecaptcha'].render(this.recaptchaElement.nativeElement, {
              'sitekey' : environment.captcha,
              'size': size,
              'callback': (response) => {
                this.captchaToken = response;
                this.needCaptcha = false;
                this.cdr.detectChanges(); 
              }
          });
      }catch(e){
          console.log(e);
          window['grecaptcha'].reset();
          this.needCaptcha = true;
      }
  }
}

addRecaptchaScript() {

  window['grecaptchaCallback'] = () => {
    this.renderReCaptch();
  }

  (function(d, s, id, obj){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { obj.renderReCaptch(); return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&amp;render=explicit";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'recaptcha-jssdk', this));

}

private checkAuthentication() {
  this.subscription.add(
      this.authService.checkAuthStatus().pipe(
          tap(isAuthenticated => {
              if (isAuthenticated) {
                  console.log('User is authenticated, redirecting...');
                  const url = this.authService.getRedirectUrl();
                  console.log('Redirect URL:', url);
                  this.router.navigate([url], {
                      replaceUrl: true,
                      queryParams: {}
                  }).then(() => {
                      console.log('Navigation completed');
                      window.history.replaceState({}, '', url);
                  });
              }
          }),
          catchError(error => {
              console.log('Not authenticated or error:', error);
              return of(false);
          })
      ).subscribe()
  );
}

private handleLoginWithEmailAndKey(email: string, key: string) {
  const form = { email, confirmationCode: key };
  this.subscription.add(
      this.authService.checkLogin(form).subscribe(
          (authenticated: boolean) => {
              if (authenticated) {
                  console.log('Authentication successful, redirecting...');
                  this.haveToken = true;
                  const url = this.authService.getRedirectUrl();
                  console.log('Redirect URL:', url);
                  
                  // Usar replaceUrl y limpiar queryParams
                  this.router.navigate([url], {
                      replaceUrl: true,
                      queryParams: {}
                  }).then(() => {
                      console.log('Navigation completed');
                      // Limpiar la URL de los parámetros
                      window.history.replaceState({}, '', url);
                  });
                  this.sending = false;
              } else {
                  // ... resto del código de error ...
              }
          },
          error => {
              console.error('Login error:', error);
              this.sending = false;
              this.toastr.error('', 'Error during login');
          }
      )
  );
}


     ngOnDestroy() {
       if(this.subscription) {
            this.subscription.unsubscribe();
        }
       if(this.subscriptionIntervals) {
            this.subscriptionIntervals.unsubscribe();
        }
        if(this.subscriptionTestForce) {
            this.subscriptionTestForce.unsubscribe();
         }
     }

     submitInvalidForm() {
       if (!this.loginForm) { return; }
       const base = this.loginForm;
       for (const field in base.form.controls) {
         if (!base.form.controls[field].valid) {
             base.form.controls[field].markAsTouched()
         }
       }
     }

     sendSignInLink() {

      if (!this.captchaToken) {
        Swal.fire(
          this.translate.instant("generics.Warning"),
          'Por favor, complete el captcha antes de continuar',
          "warning"
        );
        return;
      }
      // Rate limiting básico
      const now = Date.now();
      if (now - this.lastSubmitTime < this.THROTTLE_TIME_MS) {
        Swal.fire(
          this.translate.instant("generics.Warning"),
          'Por favor, espere unos segundos antes de intentar nuevamente',
          "warning"
        );
        return;
      }
      this.lastSubmitTime = now;
      
      this.sending = true;
      this.isLoginFailed = false;
      this.loginForm.value.email = (this.loginForm.value.email).toLowerCase();
      let form = {email: this.loginForm.value.email, captchaToken: this.captchaToken};
      this.subscription.add(this.http.post(environment.api + '/api/login', form)
      .subscribe((res: any) => {
        if(res.message == 'Si existe una cuenta asociada, recibirá un correo con el enlace de inicio de sesión.'){
          this.sending = false;
          Swal.fire({
            title: '¡Ya casi está!',
            html: '<p class="mt-2">Hemos enviado un enlace de acceso a tu dirección de email.</p><ol class="text-left"><li class="mb-2">Abre tu bandeja de entrada y busca un email de ConectamosValencia.</li> <li class="mb-2">Haz clic en el enlace dentro del email para completar el proceso de inicio de sesión. Ten en cuenta que este enlace solo es válido durante 5 minutos.</li> <li class="mb-2">Si no ves el email, revisa tu carpeta de spam o correo no deseado. Si aún no lo encuentras o el enlace ha expirado, por favor, inicia sesión de nuevo.</li> </ol>',
            icon: 'success',
            showCancelButton: false,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Ok'
          }).then((result) => {
          })
          this.isLoginFailed = false;
          this.loginForm.reset();
          this.needCaptcha = true;
          this.addRecaptchaScript();
        }else{
          this.needCaptcha = true;
          this.addRecaptchaScript();
          this.sending = false;
          this.isLoginFailed = true;
        }
      }, (err) => {
        console.log(err);
        console.log(err.error.message);
        if(err.error.message == 'recaptcha failed'){
          Swal.fire(this.translate.instant("generics.Warning"), 'Por favor, complete el captcha antes de continuar', "warning");
        }else{
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
        }
        this.needCaptcha = true;
        this.addRecaptchaScript();
        this.sending = false;
      }));

    /*this.subscription.add( this.authService.login(form).subscribe(
      (response:any) => {
        this.sending = false;
        console.log(response);
        Swal.fire({
          title: '¡Ya casi está!',
          html: '<p class="mt-2">Hemos enviado un enlace de acceso a tu dirección de email.</p><ol class="text-left"><li class="mb-2">Abre tu bandeja de entrada y busca un email de ConectamosValencia.</li> <li class="mb-2">Haz clic en el enlace dentro del email para completar el proceso de inicio de sesión. Ten en cuenta que este enlace solo es válido durante 5 minutos.</li> <li class="mb-2">Si no ves el email, revisa tu carpeta de spam o correo no deseado. Si aún no lo encuentras o el enlace ha expirado, por favor, inicia sesión de nuevo.</li> </ol>',
          icon: 'success',
          showCancelButton: false,
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Ok'
        }).then((result) => {
        })
        this.isLoginFailed = false;
        if(response.message === "Check email") { 
          Swal.fire({
            title: '¡Ya casi está!',
            html: '<p class="mt-2">Hemos enviado un enlace de acceso a tu dirección de email.</p><ol class="text-left"><li class="mb-2">Abre tu bandeja de entrada y busca un email de ConectamosValencia.</li> <li class="mb-2">Haz clic en el enlace dentro del email para completar el proceso de inicio de sesión. Ten en cuenta que este enlace solo es válido durante 5 minutos.</li> <li class="mb-2">Si no ves el email, revisa tu carpeta de spam o correo no deseado. Si aún no lo encuentras o el enlace ha expirado, por favor, inicia sesión de nuevo.</li> </ol>',
            icon: 'success',
            showCancelButton: false,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Ok'
          }).then((result) => {
          })
          this.isLoginFailed = false;
        }else{
          let message =  this.authService.getMessage();
          if(message == "Account is unactivated"){
            Swal.fire({
              title: '¡Ups!',
              html: '<p class="mt-2">Tu cuenta no ha sido activada todavía. Por favor, contacta con nosotros para que te activemos.</p>',
              icon: 'error',
              showCancelButton: false,
              confirmButtonColor: '#DD6B55',
              confirmButtonText: 'Ok'
            }).then((result) => {
            })
          }else{
            this.isLoginFailed = true;
          }
        }
        
      }));*/
    }

    onRegister() {
        this.router.navigate(['/register']);
    }
}
