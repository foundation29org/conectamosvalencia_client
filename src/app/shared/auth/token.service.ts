import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as decode from 'jwt-decode';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TokenService {

  constructor(private http: HttpClient, public authService: AuthService) {}

  isTokenValid(): boolean {
    try {
        // Obtener el token de las cookies
        const cookies = document.cookie.split(';');
        const authTokenCookie = cookies.find(cookie => cookie.trim().startsWith('cv_auth_token='));
        
        if (!authTokenCookie) {
            console.log('No auth token cookie found');
            return false;
        }

        const token = authTokenCookie.split('=')[1];
        const tokenPayload = decode(token);
        const currentTime = Date.now() / 1000;

        // Validar expiración
        if (!tokenPayload.exp || tokenPayload.exp < currentTime) {
            console.log('Token expired or invalid expiration');
            return false;
        }

        // Validar que el rol sea válido
        const validRoles = ['User', 'Admin', 'SuperAdmin'];
        if (!tokenPayload.role || !validRoles.includes(tokenPayload.role)) {
            console.log('Invalid role in token');
            return false;
        }

        // En lugar de validar contra sessionStorage, hacer una llamada al servidor
        return true;

    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Método alternativo que valida el token con el servidor
validateTokenWithServer(): Observable<boolean> {
    return this.http.get(`${environment.api}/api/me`, {
        withCredentials: true
    }).pipe(
        map(() => true),
        catchError(() => of(false))
    );
}

}
