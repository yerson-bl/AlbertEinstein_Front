import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';


@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    /** 🔹 1️⃣ Resumen general del dashboard */
    obtenerEstadisticas(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/summary`);
    }

    /** 🔹 2️⃣ Actividades recientes */
    actividadesRecientes(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/activity-timeline`);
    }

    /** 🔹 3️⃣ Rendimiento académico por salón (grado/sección) */
    obtenerRendimientoPorSalon(
        grado: string,
        seccion: string,
        fecha_inicio?: string,
        fecha_fin?: string
    ): Observable<any> {
        let params = new HttpParams()
            .set('grado', grado)
            .set('seccion', seccion);

        if (fecha_inicio) params = params.set('fecha_inicio', fecha_inicio);
        if (fecha_fin) params = params.set('fecha_fin', fecha_fin);

        console.log('[DEBUG] 🏫 Rendimiento por salón:', params.toString());
        return this.http.get<any>(`${this.apiUrl}/performance/classroom`, { params });
    }


    /** 🔹 5️⃣ Comparación de rendimiento entre varios alumnos */
    compararRendimientoAlumnos(
        alumnoIds: (number | string)[],
        materia?: string
    ): Observable<any> {
        let params = new HttpParams().set('alumno_ids', alumnoIds.join(','));
        if (materia) params = params.set('materia', materia);

        console.log('[DEBUG] 📊 Comparando rendimiento de alumnos:', {
            alumnoIds,
            materia
        });

        return this.http.get<any>(`${this.apiUrl}/performance/comparison`, { params });
    }

    /** 🔹 6️⃣ Rendimiento de materias por grado y sección */
    obtenerRendimientoPorMateria(
        grado: string,
        seccion: string
    ): Observable<any> {
        const params = new HttpParams()
            .set('grado', grado)
            .set('seccion', seccion);

        console.log('[DEBUG] 📘 Rendimiento por materia:', params.toString());
        return this.http.get<any>(`${this.apiUrl}/performance/by-subject`, { params });
    }

    /** 🔹 7️⃣ Top mejores estudiantes */
    obtenerTopEstudiantes(
        limit: number = 10,
        grado?: string
    ): Observable<any> {
        let params = new HttpParams().set('limit', limit);
        if (grado) params = params.set('grado', grado);

        console.log('[DEBUG] 🏅 Obteniendo top estudiantes:', params.toString());
        return this.http.get<any>(`${this.apiUrl}/top-students`, { params });
    }

    /** 🔹 4️⃣ Rendimiento académico por alumno */
    obtenerRendimientoPorAlumno(
        alumnoId: number | string,
        materia?: string,
        fecha_inicio?: string
    ): Observable<any> {
        let params = new HttpParams();
        if (materia) params = params.set('materia', materia);
        if (fecha_inicio) params = params.set('fecha_inicio', fecha_inicio);

        console.log('[DEBUG] 🎓 Rendimiento por alumno:', {
            alumnoId,
            materia,
            fecha_inicio
        });

        return this.http.get<any>(`${this.apiUrl}/performance/student/${alumnoId}`, { params });
    }

}
