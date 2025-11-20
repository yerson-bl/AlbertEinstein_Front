import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Docente } from 'src/app/modules/docentes/list-docentes/list-docentes.component';
import { DocenteUpdatePayload } from 'src/app/modules/docentes/list-docentes/list-docentes.component';




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
