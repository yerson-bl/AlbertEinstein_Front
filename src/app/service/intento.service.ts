import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IntentoCreate, FinalizarIntentoBody } from '../models/backend.models';

@Injectable({ providedIn: 'root' })
export class IntentoService {
  private baseUrl = `${environment.apiUrl}/intentos`;

  constructor(private http: HttpClient) {}

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // iniciarIntento(data: IntentoCreate) {
  //   return this.http.post<any>(`${this.baseUrl}/`, data, { headers: this.headers() });
  // }

  // finalizarIntento(intentoId: string, body: FinalizarIntentoBody) {
  //   return this.http.put<any>(`${this.baseUrl}/${intentoId}/finalizar`, body, { headers: this.headers() });
  // }

  // getIntentoById(intentoId: string) {
  //   return this.http.get<any>(`${this.baseUrl}/${intentoId}`, { headers: this.headers() });
  // }
}
