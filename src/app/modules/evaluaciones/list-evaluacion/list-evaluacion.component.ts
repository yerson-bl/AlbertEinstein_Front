import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { EvaluacionService } from 'src/app/service/evaluacion.service';

type EstadoEval = 'activa' | 'inactiva' | string;

interface PreguntaItem {
  enunciado: string;
  opciones?: string[];
  pregunta_id?: string;
  respuesta_correcta: string;
  tipo: 'OM' | 'VF' | string;
}

export interface EvaluacionItem {
  _id: string;
  docente_id: string;
  estado: EstadoEval;
  evaluacion_id?: string;
  fecha_creacion: string;
  fecha_entrega: string;
  grado: string;
  intentos_permitidos: number;
  materia: string;
  preguntas: PreguntaItem[];
  seccion: string;
  titulo: string;
}

@Component({
  selector: 'app-list-evaluacion',
  templateUrl: './list-evaluacion.component.html',
})
export class ListEvaluacionComponent implements OnInit, OnDestroy {
  filtros!: FormGroup;
  cargando = false;
  deleting = false;
  errorMsg: string | null = null;

  evaluaciones: EvaluacionItem[] = [];

  // Modales
  showView = false;
  showDelete = false;
  selected: EvaluacionItem | null = null;

  private subs: Subscription[] = [];

  constructor(private fb: FormBuilder, private evaluacionSrv: EvaluacionService) {}

  ngOnInit(): void {
    this.filtros = this.fb.group({
      grado: ['5', Validators.required],
      seccion: ['A', Validators.required],
    });
    this.buscar();
  }

  get totalEvaluaciones(): number { return this.evaluaciones?.length ?? 0; }
  get totalActivas(): number {
    if (!this.evaluaciones?.length) return 0;
    return this.evaluaciones.filter(e => (e.estado || '').toLowerCase() === 'activa').length;
  }
  get promedioPreguntas(): number {
    if (!this.evaluaciones?.length) return 0;
    const suma = this.evaluaciones.reduce((acc, e) => acc + (e?.preguntas?.length ?? 0), 0);
    return suma / this.evaluaciones.length;
  }

  get f() { return this.filtros.controls as any; }

  buscar(): void {
    if (this.filtros.invalid) { this.filtros.markAllAsTouched(); return; }
    const grado = this.f.grado.value;
    const seccion = this.f.seccion.value;

    this.cargando = true;
    this.errorMsg = null;

    const sub = this.evaluacionSrv
      .listarPorGradoSeccion(grado, seccion)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (rows: any[]) => {
          const mapped = (rows || []) as EvaluacionItem[];
          // orden: más reciente primero por fecha_creacion
          this.evaluaciones = [...mapped].sort((a, b) => {
            const da = new Date(a.fecha_creacion).getTime();
            const db = new Date(b.fecha_creacion).getTime();
            return db - da;
          });
        },
        error: (err) => {
          console.error('Error listando evaluaciones', err);
          this.errorMsg = 'No se pudo obtener la lista. Inténtalo nuevamente.';
          this.evaluaciones = [];
        },
      });

    this.subs.push(sub);
  }

  refrescar(): void { this.buscar(); }

  // UI helpers
  trackById = (_: number, item: EvaluacionItem) => item._id ?? item.evaluacion_id ?? String(_);

  fmtFecha(str: string): string {
    const d = new Date(str);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  estadoBadgeClasses(estado: EstadoEval): string {
    const e = (estado || '').toLowerCase();
    if (e === 'activa') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    if (e === 'inactiva') return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';
  }

  // Acciones
  verDetalles(e: EvaluacionItem): void {
    // Si necesitas refrescar desde backend por ID:
    // this.evaluacionSrv.getEvaluacionById(e._id).subscribe(...)
    this.selected = e;
    this.showView = true;
  }

  confirmarEliminar(e: EvaluacionItem): void {
    this.selected = e;
    this.showDelete = true;
  }

  eliminar(): void {
    if (!this.selected?._id) return;
    this.deleting = true;
    this.evaluacionSrv.deleteEvaluacion(this.selected._id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          // quita de la lista local
          const id = this.selected!._id;
          this.evaluaciones = this.evaluaciones.filter(x => x._id !== id);
          this.closeModals();
        },
        error: (err) => {
          console.error('Error eliminando evaluación', err);
          this.errorMsg = 'No se pudo eliminar la evaluación.';
        }
      });
  }

  closeModals(): void {
    this.showView = false;
    this.showDelete = false;
    this.selected = null;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
