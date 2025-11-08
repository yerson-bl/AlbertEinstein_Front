import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UsuarioCreate } from '../models/backend.models';
import { AlumnoUpdatePayload } from '../modules/alumnos/list-alumnos/list-alumnos.component';
import { Observable } from 'rxjs';
import { UserStorage } from '../utils/user.storage.util';
import { tap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // getUsuarioById(id: string) {
  //   return this.http.get<any>(`${this.baseUrl}/usuarios/${id}`, { headers: this.headers() });
  // }

  getUsuarioById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/usuarios/${id}`, { headers: this.headers() })
      .pipe(
        tap((usuario) => {
          console.log('[DEBUG] Usuario recibido del backend:', usuario);
          UserStorage.setUser(usuario);
        })
      );
  }





  crearUsuario(data: UsuarioCreate) {
    return this.http.post<any>(`${this.baseUrl}/usuarios/`, data);
  }

  // alumno.service.ts
  updateUsuario(id: string, data: AlumnoUpdatePayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/alumnos/${id}`, data, { headers: this.headers() });
  }

  deleteUsuario(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }
}
