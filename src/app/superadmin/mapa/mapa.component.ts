import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
declare const google: any;

export interface NeedRequest {
  needs: string[];
  otherNeeds: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}
@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.component.html',
    styleUrls: ['./mapa.component.scss']
})

export class MapaPageComponent implements OnInit{
  @ViewChild('mapContainer') mapContainer: any;
  
  center = {
    lat: 39.4699, // Valencia center
    lng: -0.3763
  };
  zoom = 7;
  
  needs: NeedRequest[] = [];
  filteredNeeds: NeedRequest[] = [];
  selectedNeedType: string = 'all';
  heatmapLayer: any;
  map: any;
  
  mapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 8,
  };
  
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


  private apiUrl = environment.api + '/api/needs';
  constructor(public translate: TranslateService, private http: HttpClient) { }

  ngOnInit() {
    this.loadNeeds();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: this.center,
      zoom: this.zoom,
      ...this.mapOptions
    });

    this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
      map: this.map,
      data: [],
      radius: 20,
      opacity: 0.8,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    });
  }


  getAllNeeds(): Observable<NeedRequest[]> {
    return this.http.get<{ data: NeedRequest[] }>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  async loadNeeds() {
    try {
      this.needs = await this.getAllNeeds().toPromise();
      this.filterNeeds();
    } catch (error) {
      console.error('Error loading needs:', error);
    }
  }

  filterNeeds() {
    if (this.selectedNeedType === 'all') {
        this.filteredNeeds = this.needs;
    } else if (this.selectedNeedType === 'other') {
        this.filteredNeeds = this.needs.filter(need => 
            need.otherNeeds && need.otherNeeds.trim().length > 0
        );
    } else {
        this.filteredNeeds = this.needs.filter(need => 
            need.needs.includes(this.selectedNeedType)
        );
    }
    this.updateHeatmap();
}

  updateHeatmap() {
    if (this.heatmapLayer) {
      const heatmapData = this.filteredNeeds.map(need => ({
        location: new google.maps.LatLng(need.location.lat, need.location.lng),
        weight: 1
      }));
      
      this.heatmapLayer.setData(heatmapData);
    }
  }

  onMapInitialized(event: any) {
    const map = this.map.googleMap;
    if (map) {
      this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        map: map,
        data: [],
        radius: 20,
        opacity: 0.8,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ]
      });
      this.filterNeeds();
    }
  }

  onNeedTypeChange(needType: string) {
    this.selectedNeedType = needType;
    this.filterNeeds();
  }

  getNeedStats() {
    const stats = {
        total: this.needs.length,
        byType: {} as {[key: string]: number}
    };

    this.needTypes.forEach(type => {
        if (type.id === 'all') return;
        
        if (type.id === 'other') {
            stats.byType[type.id] = this.needs.filter(need => 
                need.otherNeeds && need.otherNeeds.trim().length > 0
            ).length;
        } else {
            stats.byType[type.id] = this.needs.filter(need => 
                need.needs.includes(type.id)
            ).length;
        }
    });

    return stats;
}

}
