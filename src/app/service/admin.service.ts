// src/app/service/admin.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

// ===== Tipos =====
export type AdminCreatePayload = {
  nombre: string;
  apellido: string;
  correo: string;
  ['contraseña']: string;        // OJO: con acento
};

export type AdminUpdatePayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  ['contraseña']?: string;       // opcional
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // ===== Crear Admin =====
  // POST /usuarios/crear/admin
  crearAdmin(data: AdminCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/crear/admin`, data, { headers: this.headers() });
  }

  // ===== Listar / Obtener =====
  getAllAdmins(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admins`);
  }

  getAdminById(id: string | number): Observable<any> {
    const uid = encodeURIComponent(String(id));
    return this.http.get<any>(`${this.baseUrl}/admins/${uid}`);
  }

  // ===== Actualizar =====
  // PUT /usuarios/admins/:id
  updateAdmin(id: string | number, data: AdminUpdatePayload): Observable<any> {
    const uid = encodeURIComponent(String(id));
    return this.http.put<any>(`${this.baseUrl}/admins/${uid}`, data, { headers: this.headers() });
  }

  // ===== Eliminar =====
  // DELETE /usuarios/admins/:id
  deleteAdmin(id: string | number): Observable<any> {
    const uid = encodeURIComponent(String(id));
    return this.http.delete<any>(`${this.baseUrl}/admins/${uid}`, { headers: this.headers() });
  }
}
