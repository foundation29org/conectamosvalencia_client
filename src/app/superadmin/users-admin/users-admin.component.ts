import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs/Subscription';
import { SortService} from 'app/shared/services/sort.service';
import { json2csv } from 'json-2-csv';
import Swal from 'sweetalert2';
import { ErrorHandlerService } from 'app/shared/services/error-handler.service';
import { DateService } from 'app/shared/services/date.service';

@Component({
    selector: 'app-users-admin',
    templateUrl: './users-admin.component.html',
    styleUrls: ['./users-admin.component.scss']
})

export class UsersAdminComponent implements OnInit, OnDestroy{
  loadedUsers: boolean = false;
  users: any = [];
  filteredUsers: any[] = [];
  municipalities: any[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, public translate: TranslateService, public toastr: ToastrService, private sortService: SortService, private errorHandler: ErrorHandlerService, private dateService: DateService){
    
  }

  ngOnInit() {
    this.getUsers();
    this.http.get<any[]>('assets/jsons/valencia_municipios.json')
      .subscribe(data => {
        this.municipalities = data;
      });
  }

  getMunicipalityName(municipalityId: string): string {
    const municipality = this.municipalities.find(m => m.municipio_id === municipalityId);
    return municipality ? municipality.nombre : municipalityId;
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getUsers(){
    this.loadedUsers = false;
    this.subscription.add( this.http.get(environment.api+'/api/admin/allusers/')
    .subscribe( (res : any) => {
      this.users = res.data.map(user => {
        return {
          ...user,
          userName: this.capitalizeFirstLetter(user.userName)
        };
      });
      
      // Ordenar por fecha de creación (más recientes primero)
      this.users.sort(this.sortService.GetSortOrderInverse("creationDate"));
      this.filteredUsers = [...this.users];
      this.loadedUsers = true;      
    }, (err) => {
      console.log(err);
      this.loadedUsers = true;
      this.errorHandler.handleError(err, this.translate.instant("generics.error try again"));
    }));
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
  
    // filtra los datos
    const temp = this.users.filter((d) => {
      return d.userName.toLowerCase().indexOf(val) !== -1 ||
             d.email.toLowerCase().indexOf(val) !== -1 ||
             this.getMunicipalityName(d.institution).toLowerCase().indexOf(val) !== -1 ||  // Modificado aquí
             d.phone.toLowerCase().indexOf(val) !== -1 ||
             d.role.toLowerCase().indexOf(val) !== -1 ||
             !val;
    });
  
    // actualiza los datos
    this.filteredUsers = temp;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


  onSubmitExportData(){
    var tempRes = JSON.parse(JSON.stringify(this.users));
    for(var j=0;j<tempRes.length;j++){
      tempRes[j].institution = this.getMunicipalityName(tempRes[j].institution);
      tempRes[j].lastLogin = this.dateService.transformDate(tempRes[j].lastLogin);
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
    a.download    = "ConectamosValencia_"+stringDateNow+".csv";
    a.href        = url;
    a.textContent = "ConectamosValencia_"+stringDateNow+".csv";
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
              this.errorHandler.handleError(err, 'Error al activar la cuenta');
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
              this.errorHandler.handleError(err, 'Error al desactivar la cuenta');
            })
        );
      }
    });
  }

  onSort(event: any) {
    console.log('Sort Event:', event);
    // Este evento se dispara cuando se ordena una columna
    const sort = event.sorts[0];
    this.users.sort((a: any, b: any) => {
      const valueA = a[sort.prop];
      const valueB = b[sort.prop];
      
      if (valueA < valueB) {
        return sort.dir === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sort.dir === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

}
