import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private baseUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  private headers() {
    return new HttpHeaders({
      'Accept': 'application/pdf',
    });
  }

  // ✅ CORREGIDO: especificar que devuelve un blob (PDF)
  obtenerReporteAlumnoSemanal(alumnoId: number) {
    return this.http.get(`${this.baseUrl}/semanal/alumno/${alumnoId}`, {
      headers: this.headers(),
      responseType: 'blob' as 'json', // 👈 clave: devuelve binario
    });
  }



  crearReporte(intentoId: string) {
    return this.http.post<any>(`${this.baseUrl}/`, { intento_id: intentoId }, { headers: this.headers() });
  }

  getReportePorIntento(intentoId: string) {
    return this.http.get<any>(`${this.baseUrl}/intento/${intentoId}`, { headers: this.headers() });
  }
}
