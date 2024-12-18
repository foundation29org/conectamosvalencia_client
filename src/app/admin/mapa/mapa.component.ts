import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorHandlerService } from 'app/shared/services/error-handler.service';
import * as atlas from 'azure-maps-control';

@Component({
    selector: 'app-mapa',
    templateUrl: './mapa.component.html',
    styleUrls: ['./mapa.component.scss']
})

export class MapaPageComponent2 implements OnInit{
  @ViewChild('mapContainer') mapContainer: any;
  map!: atlas.Map;
  heatmapLayer!: atlas.layer.HeatMapLayer;
  center = {
    lat: 39.4699, // Valencia center
    lng: -0.3763
  };
  zoom = 7;
  
  needs: any[] = [];
  filteredNeeds: any[] = [];
  selectedNeedType: string = 'all';
  dataSource!: atlas.source.DataSource;
  
  needTypes = [
    { 
      id: 'all', 
      label: 'Todas las necesidades', 
      info: 'Incluye todas las categorías de necesidades' 
    },
    // Vivienda
    { 
      id: 'housing.noHousing', 
      label: 'Carencia de vivienda',
      category: 'Vivienda',
      info: 'Personas sin vivienda o en riesgo de perderla' 
    },
    { 
      id: 'housing.housingDeficiencies', 
      label: 'Deficiencias en la vivienda',
      category: 'Vivienda',
      info: 'Viviendas con problemas estructurales o de habitabilidad' 
    },
    { 
      id: 'housing.unsanitary', 
      label: 'Vivienda insalubre',
      category: 'Vivienda',
      info: 'Condiciones insalubres en la vivienda' 
    },
    { 
      id: 'housing.overcrowding', 
      label: 'Hacinamiento',
      category: 'Vivienda',
      info: 'Situación de hacinamiento en la vivienda' 
    },
    { 
      id: 'housing.noBasicGoods', 
      label: 'Sin bienes básicos',
      category: 'Vivienda',
      info: 'Hogares sin bienes básicos necesarios' 
    },
    { 
      id: 'housing.foodShortage', 
      label: 'Carencia de alimentación',
      category: 'Vivienda',
      info: 'Hogares con carencia de alimentación' 
    },
    // Empleo
    { 
      id: 'employment.allUnemployed', 
      label: 'Todos en paro',
      category: 'Empleo',
      info: 'Hogar con todos los miembros en paro' 
    },
    { 
      id: 'employment.jobLoss', 
      label: 'Pérdida de empleo',
      category: 'Empleo',
      info: 'Personas que han perdido su empleo' 
    },
    { 
      id: 'employment.temporaryLayoff', 
      label: 'En ERTE',
      category: 'Empleo',
      info: 'Personas en situación de ERTE' 
    },
    { 
      id: 'employment.precariousEmployment', 
      label: 'Empleo precario',
      category: 'Empleo',
      info: 'Hogar cuyo sustento principal proviene de un empleo precario' 
    },
    // Redes Sociales
    { 
      id: 'socialNetworks.socialIsolation', 
      label: 'Aislamiento social',
      category: 'Redes Sociales',
      info: 'Personas en situación de aislamiento social' 
    },
    { 
      id: 'socialNetworks.neighborConflicts', 
      label: 'Conflictos vecinales',
      category: 'Redes Sociales',
      info: 'Situaciones de conflicto con vecinos' 
    },
    { 
      id: 'socialNetworks.needsInstitutionalSupport', 
      label: 'Necesita apoyo institucional',
      category: 'Redes Sociales',
      info: 'Personas que precisan apoyo institucional' 
    },
    { 
      id: 'socialNetworks.vulnerableMinors', 
      label: 'Menores vulnerables',
      category: 'Redes Sociales',
      info: 'Menores en situación de vulnerabilidad extrema' 
    },
    // Servicios Públicos
    { 
      id: 'publicServices.noHealthCoverage', 
      label: 'Sin cobertura sanitaria',
      category: 'Servicios Públicos',
      info: 'Carencia de cobertura sanitaria' 
    },
    { 
      id: 'publicServices.discontinuedMedicalTreatment', 
      label: 'Tratamiento interrumpido',
      category: 'Servicios Públicos',
      info: 'Personas que han dejado de seguir tratamientos médicos' 
    },
    { 
      id: 'publicServices.unschooledMinors', 
      label: 'Menores sin escolarizar',
      category: 'Servicios Públicos',
      info: 'Menores sin escolarizar o con absentismo' 
    },
    { 
      id: 'publicServices.dependencyWithoutAssessment', 
      label: 'Dependencia sin valorar',
      category: 'Servicios Públicos',
      info: 'Persona en situación de dependencia sin valoración' 
    },
    { 
      id: 'publicServices.mentalHealthIssues', 
      label: 'Problemas de salud mental',
      category: 'Servicios Públicos',
      info: 'Personas con problemas de salud mental con/sin tratamiento' 
    },
    // Participación Social
    { 
      id: 'socialParticipation.memberOfOrganizations', 
      label: 'Miembro de organizaciones',
      category: 'Participación Social',
      info: 'Miembros de entidades ciudadanas, culturales y deportivas' 
    },
    { 
      id: 'socialParticipation.receivesSocialServices', 
      label: 'Recibe servicios sociales',
      category: 'Participación Social',
      info: 'Recibe atención de servicios sociales' 
    },
    // Cobertura Económica
    { 
      id: 'economicCoverage.noIncome', 
      label: 'Sin ingresos',
      category: 'Cobertura Económica',
      info: 'Personas sin ningún tipo de ingreso' 
    },
    { 
      id: 'economicCoverage.pensionsOrBenefits', 
      label: 'Pensiones/Prestaciones',
      category: 'Cobertura Económica',
      info: 'Ingresos procedentes de pensiones/prestaciones/subsidios' 
    },
    { 
      id: 'economicCoverage.receivesRviImv', 
      label: 'Percibe RVI/IMV',
      category: 'Cobertura Económica',
      info: 'Personas que perciben RVI o IMV' 
    }
  ];


  private apiUrl = environment.api + '/api/needs';
  constructor(public translate: TranslateService, private http: HttpClient, private errorHandler: ErrorHandlerService) { }

  ngOnInit() {
    this.loadNeeds();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    this.map = new atlas.Map(this.mapContainer.nativeElement, {
      center: [this.center.lng, this.center.lat],
      zoom: 7,
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: environment.azureMapsKey
      }
    });
  
    this.map.events.add('ready', () => {
      // Inicializar fuente de datos
      this.dataSource = new atlas.source.DataSource();
      this.map.sources.add(this.dataSource);
  
      // Crear la capa de heatmap con la fuente de datos inicializada
      this.heatmapLayer = new atlas.layer.HeatMapLayer(this.dataSource, null, {
        radius: 20,
        opacity: 0.8,
        colorGradient: [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0,0,255,0)',
          0.1, 'royalblue',
          0.3, 'cyan',
          0.5, 'lime',
          0.7, 'yellow',
          1, 'red'
        ]
      });
  
      this.map.layers.add(this.heatmapLayer);
  
      // Cargar necesidades filtradas
      this.filterNeeds();
    });
  }


  getAllNeeds(): Observable<any[]> {
    return this.http.get<{ data: any[] }>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  async loadNeeds() {
    try {
      this.needs = await this.getAllNeeds().toPromise();
      this.filterNeeds();
    } catch (error) {
      console.error('Error loading needs:', error);
      this.errorHandler.handleError(error, 'Error al cargar las necesidades. Por favor, inténtalo de nuevo.');
    }
  }

  filterNeeds() {
    const activeNeeds = this.needs.filter(need => need.status !== 'helped');
    
    if (this.selectedNeedType === 'all') {
      this.filteredNeeds = activeNeeds;
    } else {
      const [section, item] = this.selectedNeedType.split('.');
      
      this.filteredNeeds = activeNeeds.filter(need => {
        if (!need[section]) return false;
        return need[section][item] === true;  // Quitamos el .items
      });
    }
    
    this.updateHeatmap();
  }

  getCategories(): string[] {
    return [...new Set(this.needTypes
      .filter(type => type.category) // Excluir 'all'
      .map(type => type.category))];
  }
  
  getNeedsByCategory(category: string): any[] {
    return this.needTypes.filter(type => type.category === category);
  }

  updateHeatmap() {
    if (this.dataSource) {
      // Limpia la fuente de datos existente
      this.dataSource.clear();
  
      // Genera puntos a partir de las necesidades filtradas
      const features = this.filteredNeeds.map(need => {
        return new atlas.data.Feature(
          new atlas.data.Point([need.location.lng, need.location.lat])
        );
      });
  
      // Añade los puntos a la fuente de datos
      this.dataSource.add(features);
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
      
      const [section, item] = type.id.split('.');
      stats.byType[type.id] = this.needs.filter(need => 
        need[section]?.[item] === true  // Quitamos el .items
      ).length;
    });
  
    return stats;
  }

}
