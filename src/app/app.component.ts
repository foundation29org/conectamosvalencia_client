import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap'
import { Subscription } from 'rxjs/Subscription';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { EventsService } from 'app/shared/services/events.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  actualPage: string = '';
  tituloEvent: string = '';


  constructor(public toastr: ToastrService, private router: Router, private activatedRoute: ActivatedRoute, private titleService: Title, public translate: TranslateService, private eventsService: EventsService) {
    this.translate.use('es');
    sessionStorage.setItem('lang', 'es');
  }

  ngOnInit() {
    this.eventsService.on('http-error', function (error) {
      var msg1 = 'No internet connection';
      var msg2 = 'Trying to connect ...';

      if (sessionStorage.getItem('lang')) {
        var actuallang = sessionStorage.getItem('lang');
        if (actuallang == 'es') {
          msg1 = 'Sin conexión a Internet';
          msg2 = 'Intentando conectar ...';
        } else if (actuallang == 'pt') {
          msg1 = 'Sem conexão à internet';
          msg2 = 'Tentando se conectar ...';
        } else if (actuallang == 'de') {
          msg1 = 'Keine Internetverbindung';
          msg2 = 'Versucht zu verbinden ...';
        } else if (actuallang == 'nl') {
          msg1 = 'Geen internet verbinding';
          msg2 = 'Proberen te verbinden ...';
        }
      }
      if (error.message) {
        if (error == 'The user does not exist') {
          Swal.fire({
            icon: 'warning',
            title: this.translate.instant("errors.The user does not exist"),
            html: this.translate.instant("errors.The session has been closed")
          })
        }
      } else {

        Swal.fire({
          title: msg1,
          text: msg2,
          icon: 'warning',
          showCancelButton: false,
          confirmButtonColor: '#33658a',
          confirmButtonText: 'OK',
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons: true
        }).then((result) => {
          if (result.value) {
            location.reload();
          }

        });
      }
    }.bind(this));

    this.subscription = this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map((route) => {
        while (route.firstChild) route = route.firstChild;
        return route;
      })
      .filter((route) => route.outlet === 'primary')
      .mergeMap((route) => route.data)
      .subscribe((event) => {
        (async () => {
          await this.delay(500);
          this.tituloEvent = event['title'];
          var titulo = this.translate.instant(this.tituloEvent);
          this.titleService.setTitle(titulo);
        })();

        //para los anchor de la misma páginano hacer scroll hasta arriba
        if (this.actualPage != event['title']) {
          window.scrollTo(0, 0)
        }
        this.actualPage = event['title'];
      });

  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnDestroy() {

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

  }

}
