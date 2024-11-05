import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { AuthService } from '../../../../app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss']
})

export class LoginPageComponent implements OnDestroy, OnInit{

    @ViewChild('f') loginForm: NgForm;
    //loginForm: FormGroup;
    sending: boolean = false;

    isBlockedAccount: boolean = false;
    isLoginFailed: boolean = false;
    errorAccountActivated: boolean = false;
    emailResent: boolean = false;
    supportContacted: boolean = false;
    isAccountActivated: boolean = false;
    isActivationPending: boolean = false;
    isBlocked: boolean = false;
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

    constructor(private router: Router, public authService: AuthService, public translate: TranslateService, public toastr: ToastrService) {
      if(this.authService.getEnvironment()){
        let url =  this.authService.getRedirectUrl();
        this.router.navigate([ url ]);
      }
     }

     ngOnInit() {

      const urlParams = new URLSearchParams(window.location.search);
        const email = decodeURIComponent(urlParams.get('email') || '');
        const key = decodeURIComponent(urlParams.get('key') || '');
        if(email && key){
          let form = {email: email, confirmationCode: key};
        this.subscription.add( this.authService.checkLogin(form).subscribe(
          (authenticated:any) => {
            if(authenticated) {
              this.haveToken = true;
              let url =  this.authService.getRedirectUrl();
              this.router.navigate([ url ]);
              this.sending = false;
            }else{
              this.haveToken = false;
              this.sending = false;
              let message =  this.authService.getMessage();
                if(message == "Login failed" || message == "Not found"){
                    this.isLoginFailed = true;
                  }else{
                  this.toastr.error('', message);
                }
            }
          }));
        }
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

     sendSignInLink(email: string, event?: Event) {
      this.isLoginFailed = false;
      if(event) {
        event.preventDefault();  // Evita el envío real del formulario
      }
      let form = {email: email};
    this.subscription.add( this.authService.login(form).subscribe(
      (response:any) => {
        console.log(response);
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
        
      }));
    }

    onRegister() {
        this.router.navigate(['/register']);
    }
}
