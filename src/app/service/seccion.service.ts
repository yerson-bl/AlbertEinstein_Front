import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

export interface Seccion {
    _id: string;
    nombre: string;
    grado_id: string;
    estado: boolean;
}

export interface Grado {
    _id: string;
    nombre: string;
    descripcion: string;
    estado: boolean;
}

export interface SeccionCreatePayload {
    nombre: string;
    grado_id: string;
}

@Injectable({
    providedIn: 'root'
})
export class SeccionService {
    // ✅ Cambia el puerto según tu backend (Flask en este caso)
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    listarSecciones(): Observable<Seccion[]> {
        return this.http.get<Seccion[]>(`${this.apiUrl}/secciones`);
    }

    listarGrados(): Observable<Grado[]> {
        return this.http.get<Grado[]>(`${this.apiUrl}/grados`);
    }

    crearSeccion(payload: SeccionCreatePayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/secciones`, payload);
    }

    actualizarSeccion(id: string, payload: SeccionCreatePayload): Observable<any> {
        return this.http.put(`${this.apiUrl}/secciones/${id}`, payload);
    }

    eliminarSeccion(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/secciones/${id}`);
    }
}
