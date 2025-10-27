import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { Router } from '@angular/router';
import { EvaluacionService } from 'src/app/service/evaluacion.service';
import Swal from 'sweetalert2'; // 👈 Importamos SweetAlert2

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
  selector: 'app-lista-evaluaciones',
  templateUrl: './lista-evaluaciones.component.html',
})
export class ListaEvaluacionesComponent implements OnInit, OnDestroy {
  readonly GRADO = '5';
  readonly SECCION = 'A';
  readonly ALUMNO_ID = '3';

  cargando = false;
  errorMsg: string | null = null;

  evaluaciones: EvaluacionItem[] = [];
  filtered: EvaluacionItem[] = [];

  q = '';
  estadoFilter: 'all' | 'activa' | 'vencida' = 'all';
  sortBy: 'creacion_desc' | 'entrega_asc' | 'preguntas_desc' = 'creacion_desc';

  starting: Record<string, boolean> = {};
  showView = false;
  selected: EvaluacionItem | null = null;

  private subs: Subscription[] = [];

  constructor(
    private evaluacionSrv: EvaluacionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.buscar();
  }

  private isVencida = (e: EvaluacionItem) =>
    new Date(e.fecha_entrega).getTime() < Date.now();

  get totalEvaluaciones(): number {
    return this.evaluaciones?.length ?? 0;
  }

  get totalActivas(): number {
    if (!this.evaluaciones?.length) return 0;
    return this.evaluaciones.filter(e =>
      (e.estado || '').toLowerCase() === 'activa' && !this.isVencida(e)
    ).length;
  }

  get promedioPreguntas(): number {
    if (!this.evaluaciones?.length) return 0;
    const suma = this.evaluaciones.reduce((acc, e) => acc + (e?.preguntas?.length ?? 0), 0);
    return suma / this.evaluaciones.length;
  }

  private applyFilters(): void {
    const now = Date.now();
    const q = (this.q || '').trim().toLowerCase();

    let rows = [...(this.evaluaciones || [])];

    if (q) {
      rows = rows.filter(r =>
        (r.titulo || '').toLowerCase().includes(q) ||
        (r.materia || '').toLowerCase().includes(q) ||
        (r.docente_id || '').toLowerCase().includes(q)
      );
    }

    if (this.estadoFilter !== 'all') {
      if (this.estadoFilter === 'activa') {
        rows = rows.filter(r => (r.estado || '').toLowerCase() === 'activa' && new Date(r.fecha_entrega).getTime() >= now);
      } else if (this.estadoFilter === 'vencida') {
        rows = rows.filter(r => new Date(r.fecha_entrega).getTime() < now);
      }
    }

    rows.sort((a, b) => {
      if (this.sortBy === 'creacion_desc') {
        return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
      }
      if (this.sortBy === 'entrega_asc') {
        return new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime();
      }
      return (b.preguntas?.length ?? 0) - (a.preguntas?.length ?? 0);
    });

    this.filtered = rows;
  }

  refrescarVista(): void {
    this.applyFilters();
  }

  buscar(): void {
    this.cargando = true;
    this.errorMsg = null;

    const sub = this.evaluacionSrv
      .listarPorGradoSeccion(this.GRADO, this.SECCION)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (rows: any[]) => {
          this.evaluaciones = (rows || []) as EvaluacionItem[];
          this.applyFilters();

          // ✅ Toast éxito al cargar
          this.toast(
            `Se cargaron ${this.evaluaciones.length} evaluaciones correctamente.`,
            'success'
          );
        },
        error: (err) => {
          console.error('Error listando evaluaciones', err);
          this.errorMsg = 'No se pudo obtener la lista. Inténtalo nuevamente.';
          this.evaluaciones = [];
          this.filtered = [];

          // ❌ Toast error
          this.toast('Error al cargar las evaluaciones.', 'error');
        },
      });

    this.subs.push(sub);
  }

  refrescar(): void {
    this.q = '';
    this.estadoFilter = 'all';
    this.sortBy = 'creacion_desc';
    this.buscar();
  }

  fmtFecha(str: string): string {
    const d = new Date(str);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  puedeIniciar(e: EvaluacionItem): boolean {
    const activa = (e.estado || '').toLowerCase() === 'activa';
    return activa && !this.isVencida(e);
  }

  labelEstado(e: EvaluacionItem): string {
    const vencida = new Date(e.fecha_entrega).getTime() < Date.now();
    if (vencida) return 'Vencida';
    const est = (e.estado || '').toLowerCase();
    return est === 'activa' ? 'Activa' : (est || '—');
  }

  estadoBadgeClasses(estado: EstadoEval, fechaEntrega: string): string {
    const vencida = new Date(fechaEntrega).getTime() < Date.now();
    if (vencida) return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
    const e = (estado || '').toLowerCase();
    if (e === 'activa') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    return 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
  }

  iniciarIntento(e: EvaluacionItem): void {
    const evalId = (e as any).evaluacion_id ?? e._id;
    if (!evalId) return;

    this.starting[e._id] = true;
    const payload = { evaluacion_id: evalId, alumno_id: this.ALUMNO_ID };

    const sub = this.evaluacionSrv
      .iniciarIntento(payload)
      .pipe(finalize(() => (this.starting[e._id] = false)))
      .subscribe({
        next: (resp: any) => {
          const intentoId = resp?.intento_id;

          this.router.navigate(['alumno/iniciar-intento'], {
            state: {
              intentoId,
              intento: resp,
              evaluacion_id: evalId,
              evaluacion: e
            }
          });
        },
        error: (err) => {
          console.error('Error iniciando intento', err);
          this.errorMsg = 'No se pudo iniciar el intento. Inténtalo nuevamente.';

          // ❌ Toast error
          this.toast('Error al iniciar el intento.', 'error');
        },
      });

    this.subs.push(sub);
  }

  verDetalles(e: EvaluacionItem): void {
    this.selected = e;
    this.showView = true;
  }

  closeModals(): void {
    this.showView = false;
    this.selected = null;
  }

  trackById = (_: number, item: EvaluacionItem) => item._id ?? String(_);

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // 🔔 Método toast reutilizable
  private toast(
    msg: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'success'
  ): void {
    const t = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: { popup: 'colored-toast' },
      didOpen: (toastEl) => {
        toastEl.addEventListener('mouseenter', Swal.stopTimer);
        toastEl.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
    t.fire({ icon, title: msg });
  }
}
