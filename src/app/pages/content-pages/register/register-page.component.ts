import { Component, ViewChild, OnInit, OnDestroy, ElementRef, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

import { v4 as uuidv4 } from 'uuid';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TermsConditionsPageComponent } from "../terms-conditions/terms-conditions-page.component";
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';


@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],

})

export class RegisterPageComponent implements OnDestroy, OnInit {
  municipalities: any[] = [];
  @ViewChild('f') registerForm: NgForm;
  sending: boolean = false;

  isVerifyemail: boolean = false;
  openedTerms: boolean = false;
  isApp: boolean = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

  @ViewChild('recaptcha') recaptchaElement: ElementRef;
  captchaToken: string = "";
  needCaptcha: boolean = true;
  private lastSubmitTime: number = 0;
  private readonly THROTTLE_TIME_MS: number = 2000; // 2 segundos entre intentos

  private subscription: Subscription = new Subscription();

  constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.http.get<any[]>('assets/jsons/valencia_municipios.json')
      .subscribe(data => {
        this.municipalities = data;
      });
      
    this.addRecaptchaScript();
  }

  renderReCaptch() {
    this.needCaptcha = true;
    if(this.recaptchaElement==undefined){
        location.reload();
    }else{
        try{  
            window['grecaptcha'].render(this.recaptchaElement.nativeElement, {
                'sitekey' : environment.captcha,
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Open content Privacy Policy
  openTerms() {
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'ModalClass-sm'
    };
    const modalRef = this.modalService.open(TermsConditionsPageComponent, ngbModalOptions);
    modalRef.result.then((result) => {
      console.log(result)
      this.openedTerms = true;
    }, (reason) => {
      this.openedTerms = true;
    });
  }

  setOpenTerms(){
    this.openedTerms = true;
  }

  submitInvalidForm() {
    if (!this.registerForm) { return; }
    const base = this.registerForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
        base.form.controls[field].markAsTouched()
      }
    }
  }

  //  On submit click, reset field value
  onSubmit() {

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
    this.isVerifyemail = false;
    //codificar el password
    this.registerForm.value.email = (this.registerForm.value.email).toLowerCase();

      var params = this.registerForm.value;
      params.captchaToken = this.captchaToken;
      this.subscription.add(this.http.post(environment.api + '/api/signup', params)
        .subscribe((res: any) => {
          if (res.message == 'Login to your account if exists') {
            this.isVerifyemail = true;
            this.isVerifyemail = true;
            Swal.fire('', 
              '¡Cuenta creada correctamente! ' +
              'Ya puedes iniciar sesión.', 
              "success");
              //go to login
              this.goToLogin();
          }else if ( res.message == 'recaptcha failed') {
            Swal.fire(this.translate.instant("generics.Warning"), 'Por favor, complete el captcha antes de continuar', "warning");
          }else{
            Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          }
          if (res.message != 'Login to your account if exists') {
            this.needCaptcha = true;
            this.addRecaptchaScript();
          }
          this.registerForm.reset();
          this.sending = false;
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.registerForm.reset();
          this.sending = false;
        }));
    


  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }


}
