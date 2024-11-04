import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import {  NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';
import { SortService} from 'app/shared/services/sort.service';
import { json2csv } from 'json-2-csv';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-users-admin',
    templateUrl: './users-admin.component.html',
    styleUrls: ['./users-admin.component.scss']
})

export class UsersAdminComponent implements OnInit, OnDestroy{
  @ViewChild('f') newLangForm: NgForm;

  addedlang: boolean = false;
  lang: any;
  allLangs: any;
  langs: any;
  working: boolean = false;
  sending: boolean = false;
  loadingUsers: boolean = false;
  loadingUsersNotActived: boolean = false;
  notActivedUsers: any = [];
  users: any = [];
  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  timeformat="";
  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 3;
  rowIndex: number = -1;
  emailMsg="";
  msgList: any = {};

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, public toastr: ToastrService,private adapter: DateAdapter<any>, private sortService: SortService){
    this.adapter.setLocale(this.authService.getLang());
    this.lang = this.authService.getLang()
    switch(this.authService.getLang()){
      case 'en':
        this.timeformat="M/d/yy";
        break;
      case 'es':
          this.timeformat="d/M/yy";
          break;
      case 'nl':
          this.timeformat="d-M-yy";
          break;
      default:
          this.timeformat="M/d/yy";
          break;

    }
    
  }

  ngOnInit() {
    this.getUsers();
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getUsers(){
    this.loadingUsers = true;
    this.subscription.add( this.http.get(environment.api+'/api/admin/allusers/')
    .subscribe( (res : any) => {
      this.users = res.map(user => {
        return {
          ...user,
          userName: this.capitalizeFirstLetter(user.userName)
        };
      });
      
      // Ordenar por fecha de creación (más recientes primero)
      this.users.sort(this.sortService.GetSortOrderInverse("creationDate"));
      this.loadingUsers = false;      
    }, (err) => {
      console.log(err);
      this.loadingUsers = false;
      this.toastr.error(this.translate.instant("generics.error try again"));
    }));
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


  onSubmitExportData(){
    var tempRes = JSON.parse(JSON.stringify(this.users));
    for(var j=0;j<tempRes.length;j++){
      delete tempRes[j].icon;
    }
    this.createFile(tempRes);
  }

  createFile(res){
    let json2csvCallback = function (err, csv) {
      if (err) throw err;
      var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    var url  = URL.createObjectURL(blob);
    var p = document.createElement('p');
    document.getElementById('content').appendChild(p);

    var a = document.createElement('a');
    var dateNow = new Date();
    var stringDateNow = this.dateService.transformDate(dateNow);
    a.download    = "AyudamosValencia_"+stringDateNow+".csv";
    a.href        = url;
    a.textContent = "AyudamosValencia_"+stringDateNow+".csv";
    a.setAttribute("id", "download")

    document.getElementById('content').appendChild(a);
    document.getElementById("download").click();
  }.bind(this);

  var options ={'expandArrayObjects' :true, "delimiter": { 'field': ';' }, excelBOM: true}
  json2csv(res, json2csvCallback, options);

  }
  
  activateUser(user) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas activar la cuenta de ${user.userName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.subscription.add(
          this.http.post(environment.api + '/api/activateuser/' + user.userId, {})
            .subscribe((res: any) => {
              this.toastr.success('Cuenta activada correctamente');
              user.confirmed = true;
            }, (err) => {
              console.log(err);
              this.toastr.error('Error al activar la cuenta');
            })
        );
      }
    });
  }

  deactivateUser(user) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas desactivar la cuenta de ${user.userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.subscription.add(
          this.http.post(environment.api + '/api/deactivateuser/' + user.userId, {})
            .subscribe((res: any) => {
              this.toastr.success('Cuenta desactivada correctamente');
              user.confirmed = false;
            }, (err) => {
              console.log(err);
              this.toastr.error('Error al desactivar la cuenta');
            })
        );
      }
    });
  }

}
