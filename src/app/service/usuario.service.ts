import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsuarioCreate } from '../models/backend.models';
import { AlumnoUpdatePayload } from '../modules/alumnos/list-alumnos/list-alumnos.component';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  crearUsuario(data: UsuarioCreate) {
    return this.http.post<any>(`${this.baseUrl}/usuarios/`, data);
  }


  getUsuarioById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  // alumno.service.ts
  updateUsuario(id: string, data: AlumnoUpdatePayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/alumnos/${id}`, data, { headers: this.headers() });
  }


  deleteUsuario(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }
}
