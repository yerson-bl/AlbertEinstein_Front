import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private baseUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  crearReporte(intentoId: string) {
    return this.http.post<any>(`${this.baseUrl}/`, { intento_id: intentoId }, { headers: this.headers() });
  }

  getReportePorIntento(intentoId: string) {
    return this.http.get<any>(`${this.baseUrl}/intento/${intentoId}`, { headers: this.headers() });
  }
}
