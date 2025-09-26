import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// === Tipos del módulo de Docentes ===
export interface Docente {
  _id: string;
  apellido: string;
  contraseña_hash: string;
  correo: string;
  estado: 'activo' | 'inactivo' | string;
  fecha_creacion: string;
  grado: string[];     // << arrays
  nombre: string;
  rol: string;
  seccion: string[];   // << arrays
  usuario_id: string | number;
}

export type DocenteUpdatePayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  grado?: string[];        // << arrays
  seccion?: string[];      // << arrays
  ['contraseña']?: string; // opcional
};

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private base = '/usuarios/docentes';

  constructor(private http: HttpClient) {}

  getAllDocentes(): Observable<Docente[]> {
    return this.http.get<Docente[]>(this.base);
  }

  updateDocente(id: string | number, body: DocenteUpdatePayload): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, body);
  }

  deleteDocente(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
