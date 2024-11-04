import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from 'app/shared/auth/can-deactivate-guard.service';

import { LandPageComponent } from "./land/land-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { AboutPageComponent } from "./about/about.component";
import { FoundationPageComponent } from "./foundation/foundation.component";
import { PrivacySecurityPageComponent } from "./privacy-security/privacy-security.component";
import { SupportPageComponent } from "./support/support.component";
import { CookiesPageComponent } from "./cookies/cookies.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: LandPageComponent,
        data: {
          title: 'Ayudamos Valencia'
        },
      }
    ]
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyPageComponent,
    data: {
      title: 'registration.Privacy Policy'
    }
  },
  {
    path: 'about',
    component: AboutPageComponent,
    data: {
      title: '¿Qué es ConectamosValencia?'
    }
  },
  {
    path: 'foundation',
    component: FoundationPageComponent,
    data: {
      title: '¿Quién es Fundación 29?'
    }
  },
  {
    path: 'privacy-security',
    component: PrivacySecurityPageComponent,
    data: {
      title: 'Privacidad y seguridad'
    }
  },
  {
    path: 'support',
    component: SupportPageComponent,
    data: {
      title: 'Soporte técnico y contacto'
    }
  },
  {
    path: 'cookies',
    component: CookiesPageComponent,
    data: {
      title: 'Cookies'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandPageRoutingModule { }
