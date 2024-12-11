import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private translate: TranslateService) {}

  handleError(error: any, customMessage?: string) {
    // Si el error ya fue manejado por el interceptor, no hacemos nada
    if (error.handled) {
      return;
    }

    // Mostrar Swal con mensaje personalizado o genérico
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: customMessage || this.translate.instant('generics.error try again'),
      confirmButtonText: this.translate.instant('generics.Accept')
    });
  }
} 