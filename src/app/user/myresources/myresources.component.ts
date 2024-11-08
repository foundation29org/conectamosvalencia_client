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
    type: '',
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

  needTypes = [
    { id: 'all', label: 'Todas las necesidades', info: 'Incluye todas las categorías de necesidades' },
    { id: 'transport_logistics', label: 'Transporte y Logística', info: 'Camiones, grúas, vehículos pesados, servicios de transporte internacional, maquinaria de construcción' },
    { id: 'humanitarian_aid', label: 'Ayuda Humanitaria', info: 'Alimentos, agua, ropa, mantas, productos de higiene y limpieza' },
    { id: 'professional_services', label: 'Servicios Profesionales', info: 'Asesoramiento legal, servicios de arquitectura, peritación y gestión de seguros' },
    { id: 'construction_repair', label: 'Construcción y Reparación', info: 'Materiales de construcción, maquinaria de obra, servicios de limpieza y desescombro' },
    { id: 'technical_services', label: 'Servicios Técnicos', info: 'Instalaciones eléctricas, servicios informáticos, recuperación de datos' },
    { id: 'volunteering', label: 'Voluntariado', info: 'Mano de obra, asistencia personal, apoyo comunitario' },
    { id: 'financial_support', label: 'Apoyo Económico', info: 'Donaciones monetarias, apoyo financiero, gestión de recursos' },
    { id: 'equipment_supplies', label: 'Equipamiento y Suministros', info: 'Generadores eléctricos, herramientas, material de camping' },
    { id: 'health_services', label: 'Servicios Sanitarios', info: 'Asistencia ambulatoria, apoyo psicológico, control médico' },
    { id: 'storage', label: 'Almacenamiento', info: 'Espacios de almacenaje, puntos de recogida, gestión de donaciones' },
    { id: 'vehicles', label: 'Coches', info: 'Recursos de vehículos para quienes han perdido los suyos, ofrecidos por asociaciones como Faconauto o Sernauto' },
    { id: 'animal_resources', label: 'Recursos para Animales', info: 'Protectora, espacios donde dejarles, comida' },
    { id: 'education_training', label: 'Educación y Formación', info: 'Material escolar, clases de recuperación educativa, formación en gestión de emergencias' },
    { id: 'communication_technology', label: 'Comunicación y Tecnología', info: 'Equipos de telecomunicaciones, Wi-Fi móvil, servicios de comunicación comunitaria' },
    { id: 'temporary_infrastructure', label: 'Infraestructura Temporal', info: 'Tiendas de campaña, sistemas de purificación de agua, instalaciones sanitarias móviles' },
    { id: 'children_families', label: 'Recursos para Niños y Familias', info: 'Juguetes, guarderías temporales, asistencia para lactantes' },
    { id: 'disability_support', label: 'Asistencia a Personas con Discapacidad', info: 'Equipos de movilidad, servicios de asistencia personal, adaptaciones temporales' },
    { id: 'psychosocial_support', label: 'Apoyo Psicosocial', info: 'Grupos de apoyo emocional, actividades recreativas, terapias grupales' },
    { id: 'energy_supply', label: 'Energía y Suministro Eléctrico', info: 'Paneles solares, bancos de energía, servicios de instalación temporal' },
    { id: 'environmental_recovery', label: 'Recuperación Ambiental', info: 'Limpieza de ríos y zonas verdes, asesoramiento en recuperación de ecosistemas, reforestación' },
    { id: 'other', label: 'Otras necesidades', info: 'Categoría general para necesidades que no encajan en las anteriores' }
  ];

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

  atLeastOneNeedValidator() {
    return (formGroup: FormGroup) => {
      const needs = formGroup.get('needs') as FormArray;
      const otherNeeds = formGroup.get('otherNeeds').value;

      if (needs.length === 0 && (!otherNeeds || otherNeeds.trim() === '')) {
        return { needsRequired: true };
      }

      return null;
    };
  }

  initForm() {
    this.resourceForm = this.fb.group({
      type: ['', Validators.required],
      needs: this.fb.array([]),
      otherNeeds: [''],
      details: [''],
      lat: [null],
      lng: [null]
    }, {
      validators: this.atLeastOneNeedValidator()
    });
  
    // Actualizar validaciones cuando cambia el tipo
    this.resourceForm.get('type').valueChanges.subscribe(type => {
      const latControl = this.resourceForm.get('lat');
      const lngControl = this.resourceForm.get('lng');
      
      if (type === 'need') {
        latControl.setValidators([Validators.required]);
        lngControl.setValidators([Validators.required]);
      } else {
        latControl.clearValidators();
        lngControl.clearValidators();
      }
      
      latControl.updateValueAndValidity();
      lngControl.updateValueAndValidity();
    });
    this.editingResourceId = null;
  }

  get needsArray() {
    return this.resourceForm.get('needs') as FormArray;
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => {
      // Comprobar si hay algún valor no vacío
      return value !== '' && value !== null && value !== undefined;
    });
  }

  isNeedSelected(needId: string): boolean {
    return this.needsArray.value.includes(needId);
  }

  getNeedLabel(needId: string): string {
    const needType = this.needTypes.find(type => type.id === needId);
    return needType ? needType.label : needId;
  }

  getNeedInfo(needId: string): string {
    const needType = this.needTypes.find(type => type.id === needId);
    return needType ? needType.info : '';
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
        case 'type':
          comparison = (a.type === 'need' ? 'Necesidad' : 'Oferta')
            .localeCompare(b.type === 'need' ? 'Necesidad' : 'Oferta');
          break;
        case 'needs':
          const needsA = a.needs.map(need => this.getNeedLabel(need)).join(',');
          const needsB = b.needs.map(need => this.getNeedLabel(need)).join(',');
          comparison = needsA.localeCompare(needsB);
          break;
        case 'status':
          comparison = this.getStatusLabel(a.status)
            .localeCompare(this.getStatusLabel(b.status));
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

  onNeedToggle(needId: string, checked: boolean) {
    const needsArray = this.needsArray;
    
    if (needId === 'all' && checked) {
      // Si selecciona 'all', añadir todos los IDs excepto 'all'
      needsArray.clear();
      this.needTypes
        .filter(type => type.id !== 'all')
        .forEach(type => needsArray.push(this.fb.control(type.id)));
    } else if (needId === 'all' && !checked) {
      // Si deselecciona 'all', limpiar todo
      needsArray.clear();
    } else {
      if (checked) {
        needsArray.push(this.fb.control(needId));
        // Remover 'all' si estaba seleccionado
        const allIndex = needsArray.value.indexOf('all');
        if (allIndex >= 0) {
          needsArray.removeAt(allIndex);
        }
      } else {
        const index = needsArray.value.indexOf(needId);
        if (index >= 0) {
          needsArray.removeAt(index);
        }
      }
    }
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
      Object.keys(this.resourceForm.controls).forEach(key => {
        const control = this.resourceForm.get(key);
        control.markAsTouched();
      });
  
      const errorMessages = [];
      const form = this.resourceForm;
  
      // Validación de tipo
      if (form.get('type').errors?.required) {
        errorMessages.push('- Debes seleccionar un tipo (Necesidad u Oferta)');
      }
  
      // Validación de necesidades
      const needsArray = form.get('needs') as FormArray;
      const otherNeeds = form.get('otherNeeds').value;
      if (needsArray.length === 0 && (!otherNeeds || otherNeeds.trim() === '')) {
        errorMessages.push('- Debes seleccionar al menos una necesidad o completar el campo "Otras necesidades"');
      }
  
      // Validación de ubicación para necesidades
      if (form.get('type').value === 'need') {
        if (!form.get('lat').value || !form.get('lng').value) {
          errorMessages.push('- Para las necesidades es obligatorio indicar la ubicación en el mapa');
        }
      }
  
      // Validación de detalles (si es requerido)
      if (form.get('details').errors?.required) {
        errorMessages.push('- El campo "Detalles" es obligatorio');
      }
  
      let message = 'Por favor, completa los siguientes campos:';
      if (errorMessages.length > 0) {
        message += '<br><br>' + errorMessages.join('<br>');
      }
  
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        html: message,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
  }

  editResource(resource: any) {
    // Inicializar el formulario con los datos existentes
    this.resourceForm.patchValue({
      type: resource.type,
      otherNeeds: resource.otherNeeds,
      details: resource.details,
      lat: resource.location?.lat,
      lng: resource.location?.lng,
      status: resource.status
    });
  
    // Limpiar y establecer las necesidades seleccionadas
    const needsArray = this.resourceForm.get('needs') as FormArray;
    needsArray.clear();
    resource.needs.forEach(needId => {
      this.onNeedToggle(needId, true);
    });
  
    // Establecer el marcador en el mapa si hay ubicación
    if (resource.location?.lat && resource.location?.lng) {
      this.showMarker = true;
    }
  
    // Guardar el ID del recurso que estamos editando
    this.editingResourceId = resource._id;
  
    // Abrir el modal
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

  viewDetails(resource: any) {
    Swal.fire({
      title: 'Detalles adicionales',
      text: resource.details,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
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
          
          // Mapear los IDs a sus etiquetas
          request.formattedNeeds = request.needs.map(needId => 
            this.needTypes.find(need => need.id === needId)?.label || needId
          ).join(', ');
          
          if(request.otherNeeds) {
            request.formattedNeeds += request.formattedNeeds ? `, ${request.otherNeeds}` : request.otherNeeds;
          }
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
      type: '',
      status: '',
      date: '',
      search: ''
    };
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResources = this.resources.filter(resource => {
      let matchesType = true;
      let matchesStatus = true;
      let matchesDate = true;
      let matchesSearch = true;
  
      // Filtro por tipo
      if (this.filters.type) {
        matchesType = resource.type === this.filters.type;
      }
  
      // Filtro por estado
      if (this.filters.status) {
        matchesStatus = resource.status === this.filters.status;
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
        const needsString = resource.needs.map(need => this.getNeedLabel(need)).join(' ').toLowerCase();
        const otherNeedsString = resource.otherNeeds ? resource.otherNeeds.toLowerCase() : '';
        const detailsString = resource.details ? resource.details.toLowerCase() : '';
        
        matchesSearch = needsString.includes(searchTerm) || 
                       otherNeedsString.includes(searchTerm) ||
                       detailsString.includes(searchTerm);
      }
  
      return matchesType && matchesStatus && matchesDate && matchesSearch;
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
