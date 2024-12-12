import { Component, ViewChild, OnDestroy, NgZone, OnInit } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ErrorHandlerService } from 'app/shared/services/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-myresources',
    templateUrl: './myresources.component.html',
    styleUrls: ['./myresources.component.scss']
})

export class MyResourcesComponent implements OnInit, OnDestroy{
  @ViewChild('myTable') table: DatatableComponent;
  selectedRow: any = null;
  loadedNeeds: boolean = false;
  resources: any = [];
  filteredResources: any[] = [];
  filters = {
    fullName: '',
    idNumber: '',
    status: '',
    date: '',
    search: ''
  };
  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  startIndex = 0;
  endIndex = 0;
  resourceForm: FormGroup;
  sortDirection = 1;  // 1 ascendente, -1 descendente
  sortColumn = 'timestamp';  

  map: any;
  mapClickListener: any;
  showMarker = false;
  selectedLocation: any = null;
  @ViewChild('mapModal') mapModal: any;

  @ViewChild('contentResource') contentResource: any;
  editingResourceId: string | null = null;

  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();


  defaultLat: number = 39.4699;
  defaultLng: number = -0.3763;
  lat: number = 39.4699;
  lng: number = -0.3763;
  zoom = 7;
  rowIndex: number = -1;

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, public toastr: ToastrService, private modalService: NgbModal, private dateService: DateService, private fb: FormBuilder, private zone: NgZone, private errorHandler: ErrorHandlerService){
    this.initForm();
  }

  ngOnInit() {
    this.getRequests();
    
    // Observar cambios en los filtros
    Object.keys(this.filters).forEach(key => {
      this.resourceForm.get(key)?.valueChanges.subscribe(() => {
        this.applyFilters();
      });
    });
  }


  initForm() {
    this.resourceForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: ['', Validators.required],
        idType: ['', Validators.required],
        idNumber: ['', Validators.required],
        lostDocumentation: [false],
        birthDate: ['', Validators.required],
        gender: ['', Validators.required],
        language: ['', Validators.required],
        residence: ['', Validators.required],
        city: ['', Validators.required],
        householdMembers: ['', [Validators.required, Validators.min(1)]],
        phone: ['', [
          Validators.required,
          Validators.pattern('^[+]?[0-9]{9,15}$')  // Permite entre 9 y 15 dígitos, y el símbolo + opcional
        ]]
      }),
      housing: this.fb.group({
        items: this.fb.group({
          noHousing: [false],
          housingDeficiencies: [false],
          unsanitary: [false],
          overcrowding: [false],
          noBasicGoods: [false],
          foodShortage: [false]
        }),
        observations: ['']
      }),
      employment: this.fb.group({
        items: this.fb.group({
          allUnemployed: [false],
          jobLoss: [false],
          temporaryLayoff: [false],
          precariousEmployment: [false]
        }),
        observations: ['']
      }),
      socialNetworks: this.fb.group({
        items: this.fb.group({
          socialIsolation: [false],
          neighborConflicts: [false],
          needsInstitutionalSupport: [false],
          vulnerableMinors: [false]
        }),
        observations: ['']
      }),
      publicServices: this.fb.group({
        items: this.fb.group({
          noHealthCoverage: [false],
          discontinuedMedicalTreatment: [false],
          unschooledMinors: [false],
          dependencyWithoutAssessment: [false],
          mentalHealthIssues: [false]
        }),
        observations: ['']
      }),
      socialParticipation: this.fb.group({
        items: this.fb.group({
          memberOfOrganizations: [false],
          receivesSocialServices: [false]
        }),
        observations: ['']
      }),
      economicCoverage: this.fb.group({
        items: this.fb.group({
          noIncome: [false],
          pensionsOrBenefits: [false],
          receivesRviImv: [false]
        }),
        observations: ['']
      }),
      details: [''],
      lat: [null, Validators.required],
      lng: [null, Validators.required]
    });
  
    // Actualizar validaciones cuando cambia el tipo
      const latControl = this.resourceForm.get('lat');
      const lngControl = this.resourceForm.get('lng');
      
      latControl.setValidators([Validators.required]);
      lngControl.setValidators([Validators.required]);
      
      latControl.updateValueAndValidity();
      lngControl.updateValueAndValidity();
    this.editingResourceId = null;
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => {
      // Comprobar si hay algún valor no vacío
      return value !== '' && value !== null && value !== undefined;
    });
  }


  getStatusLabel(status: string): string {
    const statusMap = {
      'new': 'Nuevo',
      'in_progress': 'En proceso',
      'completed': 'Completado'
    };
    return statusMap[status] || status;
  }

  sort(column: string) {
    // Si hacemos clic en la misma columna, cambiamos la dirección
    if (this.sortColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortColumn = column;
      this.sortDirection = 1;
    }
  
    // Crear una copia del array para no mutar el original directamente
    this.filteredResources = [...this.filteredResources].sort((a, b) => {
      let comparison = 0;
      
      switch (column) {
        case 'status':
          comparison = this.getStatusLabel(a.status)
            .localeCompare(this.getStatusLabel(b.status));
          break;
        case 'fullName':
          comparison = a.personalInfo.fullName.localeCompare(b.personalInfo.fullName);
          break;
        case 'idNumber':
          comparison = a.personalInfo.idNumber.localeCompare(b.personalInfo.idNumber);
          break;
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        default:
          comparison = 0;
      }
  
      return comparison * this.sortDirection;
    });
  
    // Actualizar la paginación
    this.currentPage = 1;
    this.updatePaginationIndexes();
  }
  
  updatePaginationIndexes() {
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredResources.length);
    this.totalItems = this.filteredResources.length;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 1 ? '↑' : '↓';
    }
    return '↕';
  }


  showNewResourceModal(content) {
    this.initForm(); // Asegurarse de que el formulario está inicializado
    
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-lg'
    };
    this.modalReference = this.modalService.open(content, ngbModalOptions);
  }

  closeModal() {
    this.modalReference.close();
  }

  async saveResource() {
    if (this.resourceForm.valid) {
      const resourceData = this.resourceForm.value;
      resourceData.location = {
        lat: resourceData.lat,
        lng: resourceData.lng
      };
      
      try {
        if(this.editingResourceId){
          await this.updateNeed(resourceData).toPromise();
        }else{
          await this.submitNeed(resourceData).toPromise();
        }
        // Mostrar éxito
        if(this.editingResourceId){
          Swal.fire({
            icon: 'success',
            title: '',
            text: 'Recurso actualizado correctamente',
            confirmButtonText: 'Aceptar'
          });
        }else{
          Swal.fire({
            icon: 'success',
            title: '',
            text: 'Recurso creado correctamente',
            confirmButtonText: 'Aceptar'
          });
          
        }
        
        this.closeModal();
        this.getRequests(); // Recargar la lista
      } catch (error) {
        console.error('Error al crear el recurso:', error);
        this.errorHandler.handleError(error, 'No se pudo crear el recurso. Por favor, inténtalo de nuevo.');
      }
    } else {
      // Marcar todos los campos como tocados para mostrar los errores
    Object.keys(this.resourceForm.controls).forEach(key => {
      const control = this.resourceForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(subKey => {
          control.get(subKey).markAsTouched();
        });
      } else {
        control.markAsTouched();
      }
    });

    const errorMessages = [];
    const form = this.resourceForm;

    // Validación de información personal
    const personalInfo = form.get('personalInfo');
    if (personalInfo.invalid) {
      if (!personalInfo.get('fullName').value) {
        errorMessages.push('- Nombre e iniciales de los apellidos');
      }
      if (!personalInfo.get('idType').value || !personalInfo.get('idNumber').value) {
        errorMessages.push('- Identificación completa (tipo y número)');
      }
      if (!personalInfo.get('birthDate').value) {
        errorMessages.push('- Fecha de nacimiento');
      }
      if (!personalInfo.get('gender').value) {
        errorMessages.push('- Sexo');
      }
      if (!personalInfo.get('language').value) {
        errorMessages.push('- Idioma');
      }
      if (!personalInfo.get('residence').value) {
        errorMessages.push('- Residencia');
      }
      if (!personalInfo.get('city').value) {
        errorMessages.push('- Población');
      }
      if (!personalInfo.get('householdMembers').value || personalInfo.get('householdMembers').value < 1) {
        errorMessages.push('- Número de miembros de la unidad de convivencia (debe ser mayor que 0)');
      }
      if (!personalInfo.get('phone').value) {
        errorMessages.push('- Teléfono de contacto');
      }
    }

    // Validación de ubicación
    if (!form.get('lat').value || !form.get('lng').value) {
      errorMessages.push('- Es obligatorio indicar la ubicación en el mapa');
    }

    if (errorMessages.length > 0) {
      let message = 'Por favor, completa los siguientes campos obligatorios:';
      message += '<br><br>' + errorMessages.join('<br>');

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        html: '<div class="text-left">'+message+'</div>',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    }
  }

  editResource(resource: any) {
    // Reestructurar la ubicación para que coincida con el formulario
    const resourceData = {
      ...resource,
      lat: resource.location?.lat,
      lng: resource.location?.lng
    };
    delete resourceData.location;  // Eliminamos el objeto location original

    // Inicializar el formulario con todos los datos
    this.resourceForm.patchValue(resourceData);
  
    // Establecer el marcador en el mapa si hay ubicación
    if (resource.location?.lat && resource.location?.lng) {
      this.showMarker = true;
    }
  
    this.editingResourceId = resource._id;
    
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-lg'
    };
    
    this.modalReference = this.modalService.open(this.contentResource, ngbModalOptions);
}

  deleteResource(resourceId: string) {
    // Mostrar diálogo de confirmación
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Proceder con la eliminación
        this.http.delete(`${environment.api}/api/needs/${this.authService.getIdUser()}/${resourceId}`)
          .subscribe(
            () => {
              // Éxito
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El recurso ha sido eliminado correctamente',
                confirmButtonText: 'Aceptar'
              });
              // Recargar la lista
              this.getRequests();
            },
            (error) => {
              // Error
              console.error('Error al eliminar el recurso:', error);
              this.errorHandler.handleError(error, 'No se pudo eliminar el recurso. Por favor, inténtalo de nuevo.');
            }
          );
      }
    });
  }


  submitNeed(needRequest): Observable<any> {
    let apiUrl = environment.api + '/api/needs/'+this.authService.getIdUser();
    return this.http.post(apiUrl, needRequest);
  }

  updateNeed(needRequest): Observable<any> {
    let apiUrl = environment.api + '/api/needs/'+this.authService.getIdUser()+'/'+this.editingResourceId;
    return this.http.put(apiUrl, needRequest);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.mapClickListener) {
      google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
  }

  getRequests(){
    this.loadedNeeds = false;
    this.subscription.add( this.http.get(environment.api+'/api/needsuser/complete/'+this.authService.getIdUser())
    .subscribe( (response : any) => {
      if(response.success) {
        const requests = response.data;
        for(let request of requests){
          request.lat = request.location.lat;
          request.lng = request.location.lng;
          request.formattedDate = this.dateService.transformDate(new Date(request.timestamp));
          
        }
        this.resources = requests.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        

        this.filteredResources = [...this.resources]; // Copia inicial
        this.totalItems = this.resources.length;
        this.updatePaginationIndexes();
        //this.applyFilters();
      }
      this.loadedNeeds = true;      
    }, (err) => {
      console.log(err);
      this.loadedNeeds = true;
    }));
  }

  clearFilters() {
    this.filters = {
      fullName: '',
      idNumber: '',
      status: '',
      date: '',
      search: ''
    };
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResources = this.resources.filter(resource => {
      let matchesStatus = true;
      let matchesDate = true;
      let matchesSearch = true;
      let matchesFullName = true;
      let matchesIdNumber = true;
  
      // Filtro por estado
      if (this.filters.status) {
        matchesStatus = resource.status === this.filters.status;
      }
      if(this.filters.fullName){
        matchesFullName = resource.personalInfo.fullName.toLowerCase().includes(this.filters.fullName.toLowerCase());
      }
      if(this.filters.idNumber){
        matchesIdNumber = resource.personalInfo.idNumber.toLowerCase().includes(this.filters.idNumber.toLowerCase());
      }
  
      // Filtro por fecha
      if (this.filters.date) {
        const filterDate = new Date(this.filters.date);
        const resourceDate = new Date(resource.timestamp);
        matchesDate = filterDate.toDateString() === resourceDate.toDateString();
      }
  
      // Filtro por texto
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
      
        const detailsString = resource.details ? resource.details.toLowerCase() : '';
        const fullNameString = resource.personalInfo.fullName.toLowerCase();    
        const idNumberString = resource.personalInfo.idNumber.toLowerCase();
        
        matchesSearch = detailsString.includes(searchTerm) || fullNameString.includes(searchTerm) || idNumberString.includes(searchTerm);
      }
  
      return matchesStatus && matchesDate && matchesSearch && matchesFullName && matchesIdNumber;
    });
  
    // Actualizar la paginación
    this.totalItems = this.filteredResources.length;
    this.currentPage = 1;
    this.updatePaginationIndexes();
  }

  paginateResources(resources: any[]) {
    const start = (this.currentPage - 1) * this.pageSize;
    return resources.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  async updateStatus(resource: any) {
    try {
      /*await this.http.put(`${environment.api}/api/needs/${resource._id}`, {
        status: resource.status
      }).toPromise();*/
      this.editingResourceId = resource._id;
      await this.updateNeed(resource).toPromise();
  
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: 'El estado se ha actualizado correctamente',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      
      // Revertir el cambio en caso de error
      resource.status = resource.previousStatus;

      this.errorHandler.handleError(error, 'No se pudo actualizar el estado. Por favor, inténtalo de nuevo.');
    }
  }

  mapReadyHandler(map: google.maps.Map): void {
    this.map = map;
    this.mapClickListener = this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.zone.run(() => {
        this.resourceForm.patchValue({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        });
        this.showMarker = true;
      });
    });
  }

  onMarkerDragEnd(event: any) {
    this.resourceForm.patchValue({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    });
  }

  clearLocation() {
    this.resourceForm.patchValue({
      lat: '',
      lng: ''
    });
    this.showMarker = false;
  }

 showOnMap(location: any) {
  let ngbModalOptions: NgbModalOptions = {
    keyboard: false,
    windowClass: 'ModalClass-md'
  };
  
  this.selectedLocation = location;
  this.modalService.open(this.mapModal, ngbModalOptions);
}


}
