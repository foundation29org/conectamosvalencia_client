import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { DateService } from 'app/shared/services/date.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { json2csv } from 'json-2-csv';
import Swal from 'sweetalert2';
import { ErrorHandlerService } from 'app/shared/services/error-handler.service';

@Component({
    selector: 'app-resources',
    templateUrl: './resources.component.html',
    styleUrls: ['./resources.component.scss']
})

export class ResourcesComponent implements OnInit, OnDestroy{
  @ViewChild('myTable') table: DatatableComponent;
  selectedRow: any = null;

  working: boolean = false;
  sending: boolean = false;
  loadingNeeds: boolean = false;
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

  sortDirection = 1;  // 1 ascendente, -1 descendente
  sortColumn = 'timestamp';  

  map: any;
  mapClickListener: any;
  showMarker = false;
  selectedLocation: any = null;
  @ViewChild('mapModal') mapModal: any;

  editingResourceId: string | null = null;

  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  timeformat="";
  groupId: any;
  groupEmail: any;
  defaultLat: number = 39.4699;
  defaultLng: number = -0.3763;
  lat: number = 39.4699;
  lng: number = -0.3763;
  zoom = 7;
  rowIndex: number = -1;
  emailMsg="";
  msgList: any = {};

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

  constructor(private http: HttpClient, public translate: TranslateService, public toastr: ToastrService, private modalService: NgbModal, private dateService: DateService, private errorHandler: ErrorHandlerService){


  }

  ngOnInit() {
    this.getRequests();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(value => {
      // Comprobar si hay algún valor no vacío
      return value !== '' && value !== null && value !== undefined;
    });
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

  closeModal() {
    this.modalReference.close();
  }

  updateStatusNeed(needRequest): Observable<any> {
    let apiUrl = environment.api + '/api/status/needs/'+this.editingResourceId;
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

  viewPhone(resource: any) {
    //get the phone from the resource in ddbb
    this.http.get(environment.api+'/api/needs/phone/'+resource._id).subscribe((res: any) => {
      Swal.fire({
        title: 'Teléfono',
        text: res.data,
        icon: 'info',
        confirmButtonText: 'Cerrar'
      });
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
    this.loadingNeeds = true;
    this.subscription.add( this.http.get(environment.api+'/api/needs/complete')
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
      this.loadingNeeds = false;      
    }, (err) => {
      console.log(err);
      this.loadingNeeds = false;
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

      const status = resource.status;
    const statusInfo = this.translate.instant(`needs.status.${status}`);
    
    const data = { 
      status: status,
      statusInfo: statusInfo
    };

      await this.updateStatusNeed(data).toPromise();
  
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


 showOnMap(location: any) {
  let ngbModalOptions: NgbModalOptions = {
    keyboard: false,
    windowClass: 'ModalClass-md'
  };
  
  this.selectedLocation = location;
  this.modalService.open(this.mapModal, ngbModalOptions);
}

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  

  onSubmitExportData(){
    var tempRes = JSON.parse(JSON.stringify(this.resources));
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

  onMarkerClick(request: any) {
    console.log('Marker clicked:', request); // Para verificar que se llama
    this.selectedRow = request;
    
    // Encontrar el índice de la fila
    const rowIndex = this.resources.findIndex(user => user === request);
    
    if (rowIndex >= 0) {
        // Calcular la página donde está la fila
        const pageSize = this.table.pageSize || 10;
        const pageNumber = Math.floor(rowIndex / pageSize);
        this.table.offset = pageNumber;
        
        // Esperar a que se actualice la vista
        setTimeout(() => {
            // Buscar la fila por su índice
            const rows = document.querySelectorAll('.datatable-row-wrapper');
            const targetRow = rows[rowIndex % pageSize];
            
            if (targetRow) {
                //targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRow.classList.add('flash-highlight');
                setTimeout(() => targetRow.classList.remove('flash-highlight'), 1000);
            }
        }, 100);
    }
  }

getRowClass = (row: any) => {
  return {
    'selected-row': this.selectedRow === row
  };
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
      this.http.delete(`${environment.api}/api/superadmin/needs/${resourceId}`)
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


}
