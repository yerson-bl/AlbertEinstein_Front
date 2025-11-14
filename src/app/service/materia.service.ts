import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

export interface Materia {
    _id: string;
    estado: string;
    materia_id: string;
    nombre: string;  
}

export interface MateriaCreatePayload {
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class MateriaService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    
    materiaPorId(materiaId: string): Observable<Materia> {
        return this.http.get<Materia>(`${this.apiUrl}/materias/${materiaId}`);
    }

    listarMateria(): Observable<Materia[]> {
        return this.http.get<Materia[]>(`${this.apiUrl}/materias`);
    }
    crearMateria(payload: MateriaCreatePayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/materias`, payload);
    }
    actualizarMateria(id: string, payload: MateriaCreatePayload): Observable<any> {
        return this.http.put(`${this.apiUrl}/materias/${id}`, payload);
    }
    eliminarMateria(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/materias/${id}`);
    }

}
