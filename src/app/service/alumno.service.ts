import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsuarioCreate } from '../models/backend.models';
import { Observable } from 'rxjs';
import { AlumnoUpdatePayload } from '../modules/alumnos/list-alumnos/list-alumnos.component';
import { Alumno } from '../modules/alumnos/list-alumnos/list-alumnos.component';


@Injectable({ providedIn: 'root' })
export class AlumnoService {
    private baseUrl = `${environment.apiUrl}/usuarios`;

    constructor(private http: HttpClient) { }

    private headers() {
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    crearAlumno(data: UsuarioCreate) {
        return this.http.post<any>(`${this.baseUrl}/crear/alumno`, data);
    }

    getAllAlumnos(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/alumnos`);
    }


    updateAlumno(id: string | number, data: AlumnoUpdatePayload) {
        const uid = encodeURIComponent(String(id));   // normaliza a string
        return this.http.put<any>(`${this.baseUrl}/alumnos/${uid}`, data, { headers: this.headers() });
    }

    deleteAlumno(id: string | number) {
        const uid = encodeURIComponent(String(id));
        return this.http.delete<any>(`${this.baseUrl}/alumnos/${uid}`, { headers: this.headers() });
    }

    getAlumnoById(id: string | number) {
        const uid = encodeURIComponent(String(id));
        return this.http.get<any>(`${this.baseUrl}/alumnos/${uid}`);
    }


}
