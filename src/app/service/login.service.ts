import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface LoginPayload {
  correo: string;
  contraseña: string;
}

export interface LoginResponse {
  rol: 'Admin' | 'Docente' | 'Alumno';
  token: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  private headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  login(payload: LoginPayload) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload, {
      headers: this.headers(),
    });
  }

  guardarSesion(rol: string, token: string) {
    localStorage.setItem('rol', rol);
    localStorage.setItem('jwt_token', token);
  }

  obtenerRol(): string | null {
    return localStorage.getItem('rol');
  }

  obtenerToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  cerrarSesion() {
    localStorage.removeItem('rol');
    localStorage.removeItem('jwt_token');
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }
}
