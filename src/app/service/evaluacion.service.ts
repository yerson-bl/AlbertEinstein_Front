// evaluacion.service.ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import type { EvaluacionCreate } from '../models/backend.models'; // 👈 usa el del modelo

export type EvaluacionUpdate = Partial<EvaluacionCreate>;

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private baseUrl = `${environment.apiUrl}/evaluaciones`;

  constructor(private http: HttpClient) { }

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  crearEvaluacion(data: EvaluacionCreate) {
    return this.http.post<any>(`${this.baseUrl}/crear`, data, { headers: this.headers() });
  }

  listarPorGradoSeccion(grado: string | number, seccion: string) {
    const params = new HttpParams().set('grado', String(grado)).set('seccion', seccion);
    return this.http.get<any[]>(`${this.baseUrl}/listado`, { params, headers: this.headers() });
  }

  getEvaluacionById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/${encodeURIComponent(id)}`, { headers: this.headers() });
  }

  updateEvaluacion(id: string, data: EvaluacionUpdate) {
    return this.http.put<any>(`${this.baseUrl}/${encodeURIComponent(id)}`, data, { headers: this.headers() });
  }

  deleteEvaluacion(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/${encodeURIComponent(id)}`, { headers: this.headers() });
  }
}
