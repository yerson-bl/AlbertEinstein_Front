// evaluacion.service.ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import type { EvaluacionCreate } from '../models/backend.models'; // 👈 usa el del modelo

export type EvaluacionUpdate = Partial<EvaluacionCreate>;

// --- Tipos para intentos (opcionales pero útiles) ---
export interface IntentoCreatePayload {
  evaluacion_id: string;   // ID de la evaluación seleccionada
  alumno_id: string;       // por ahora "3"
}

export interface RespuestaIntento {
  pregunta_id: string;
  opcion_marcada: string | number; // "4", "Falso", etc.
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private baseUrl = `${environment.apiUrl}/evaluaciones`;
  private intentosUrl = `${environment.apiUrl}/intentos`;

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
  // ----------------- Intentos -----------------

  /** POST /intentos  -> crea (inicia) un intento */
  iniciarIntento(payload: IntentoCreatePayload) {
    // Ejemplo body esperado por tu API:
    // { "evaluacion_id": "<ID_EVAL>", "alumno_id": "3" }
    return this.http.post<any>(`${this.intentosUrl}`, payload, { headers: this.headers() });
  }

  /** GET /intentos/:id  (si necesitas consultar el intento) */
  getIntentoById(intentoId: string) {
    return this.http.get<any>(`${this.intentosUrl}/${encodeURIComponent(intentoId)}`, { headers: this.headers() });
  }

  /** PUT /intentos/:id/finalizar  -> envía respuestas y cierra el intento */
  finalizarIntento(intentoId: string, respuestas: RespuestaIntento[]) {
    // Body según tu captura:
    // { "respuestas": [ { "pregunta_id": "...", "opcion_marcada": "4" }, ... ] }
    const body = { respuestas };
    return this.http.put<any>(
      `${this.intentosUrl}/${encodeURIComponent(intentoId)}/finalizar`,
      body,
      { headers: this.headers() }
    );
  }
}