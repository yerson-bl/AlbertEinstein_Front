import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { debounceTime, Subject, takeUntil, forkJoin } from 'rxjs';
import { AlumnoService } from 'src/app/service/alumno.service';
import { SeccionService } from 'src/app/service/seccion.service';

type EstadoAlumno = 'activo' | 'inactivo' | string;

export interface Alumno {
  _id: string;
  apellido: string;
  contraseña_hash: string;
  correo: string;
  estado: EstadoAlumno;
  fecha_creacion: string;
  grado: string;
  nombre: string;
  rol: string;
  seccion: string;
  usuario_id: string | number;
}

export interface Grado {
  _id: string;
  nombre: string;
  descripcion?: string;
}

export interface Seccion {
  _id: string;
  nombre: string;
  grado_id?: string;
}

export type AlumnoUpdatePayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  grado?: string;
  seccion?: string;
  ['contraseña']?: string;
};

type SortDir = 'asc' | 'desc';
type SortKey = keyof Pick<
  Alumno,
  '_id' | 'apellido' | 'correo' | 'estado' | 'fecha_creacion' | 'grado' | 'nombre' | 'rol' | 'seccion' | 'usuario_id'
>;

@Component({
  selector: 'app-list-alumnos',
  templateUrl: './list-alumnos.component.html',
  standalone: false,
})
export class ListAlumnosComponent implements OnInit {
  // === Estado general ===
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  alumnos = signal<Alumno[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);

  // Filtros
  search$ = new Subject<string>();
  search = signal<string>('');
  filtroGrado = signal<string>('');
  filtroSeccion = signal<string>('');
  filtroEstado = signal<string>('');

  // Orden
  sortKey = signal<SortKey>('apellido');
  sortDir = signal<SortDir>('asc');

  // Paginación
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizes = [10, 25, 50];

  private destroy$ = new Subject<void>();

  // === Mapas (id → nombre) ===
  gradosMap = new Map<string, string>();
  seccionesMap = new Map<string, string>();

  constructor(
    private alumnoService: AlumnoService,
    private seccionService: SeccionService
  ) { }

  ngOnInit(): void {
    this.search$.pipe(debounceTime(250), takeUntil(this.destroy$)).subscribe(v => {
      this.search.set(v);
      this.page.set(1);
    });

    // Cargar datos base
    this.cargarReferenciasYAlumnos();
  }

  // === Cargar grados + secciones + alumnos ===
  private cargarReferenciasYAlumnos(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      grados: this.seccionService.listarGrados(),
      secciones: this.seccionService.listarSecciones(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ grados, secciones }) => {
          this.grados.set(grados || []);
          this.secciones.set(secciones || []);

          // llenar mapas
          this.gradosMap.clear();
          this.seccionesMap.clear();
          grados?.forEach((g: Grado) =>
            this.gradosMap.set(g._id, g.nombre || g.descripcion || '—')
          );
          secciones?.forEach((s: Seccion) =>
            this.seccionesMap.set(s._id, s.nombre || '—')
          );

          // luego traer alumnos
          this.fetch();
        },
        error: (e) => {
          console.error('Error cargando grados o secciones', e);
          this.error.set('No se pudieron cargar los grados o secciones.');
          this.loading.set(false);
        },
      });
  }

  // === Obtener alumnos ===
  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.alumnoService
      .getAllAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: Alumno[]) => {
          const list = (Array.isArray(res) ? res : []).map(a => ({
            ...a,
            grado: String(a.grado).trim(),
            seccion: String(a.seccion).trim(),
          }));
          this.alumnos.set(list);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('No se pudieron cargar los alumnos.');
          console.error(err);
          this.loading.set(false);
        },
      });
  }

  // === Traducción de ID a nombre ===
  getNombreGrado(id?: string): string {
    if (!id) return '';
    return this.gradosMap.get(id) || id;
  }

  getNombreSeccion(id?: string): string {
    if (!id) return '';
    return this.seccionesMap.get(id) || id;
  }

  // === Filtros ===
  onSearch(v: string) {
    this.search$.next(v);
  }

  setFilter(kind: 'grado' | 'seccion' | 'estado', value: string) {
    if (kind === 'grado') this.filtroGrado.set(value);
    if (kind === 'seccion') this.filtroSeccion.set(value);
    if (kind === 'estado') this.filtroEstado.set(value);
    this.page.set(1);
  }

  clearFilters() {
    this.filtroGrado.set('');
    this.filtroSeccion.set('');
    this.filtroEstado.set('');
    this.search.set('');
    this.page.set(1);
  }

  // === Ordenamiento ===
  sortBy(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  // === Computed filtrados ===
  filteredSorted = computed<Alumno[]>(() => {
    const q = this.search();
    const g = this.filtroGrado();
    const s = this.filtroSeccion();
    const e = this.filtroEstado();

    let list = this.alumnos().filter(a => {
      const matchQ =
        !q ||
        this.hay(a.nombre, q) ||
        this.hay(a.apellido, q) ||
        this.hay(a.correo, q) ||
        this.hay(a.usuario_id, q);

      const matchG = !g || a.grado === g;
      const matchS = !s || a.seccion === s;
      const matchE = !e || a.estado === e;

      return matchQ && matchG && matchS && matchE;
    });

    const key = this.sortKey();
    const dir = this.sortDir();

    list = list.sort((a, b) => {
      let va: any = a[key], vb: any = b[key];
      if (key === 'fecha_creacion') {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = this.norm(va).localeCompare(this.norm(vb), undefined, { numeric: true });
        return dir === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

    return list;
  });

  // === Paginación ===
  pageSlice = computed(() => {
    const p = this.page();
    const sz = this.pageSize();
    const start = (p - 1) * sz;
    return this.filteredSorted().slice(start, start + sz);
  });

  totalFiltered = computed(() => this.filteredSorted().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  goPage(delta: number) {
    const p = Math.min(Math.max(1, this.page() + delta), this.totalPages());
    this.page.set(p);
  }

  goto(p: number) {
    const safe = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(safe);
  }

  // === Utilidades ===
  formatDate(gmt: string): string {
    const d = new Date(gmt);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('es-PE', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  private norm(v: string | number | null | undefined): string {
    return String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private hay(texto: string | number | null | undefined, q: string): boolean {
    return this.norm(texto).includes(this.norm(q));
  }

  // === Modales ===
  actionRow = signal<Alumno | null>(null);
  showView = signal<boolean>(false);
  showEdit = signal<boolean>(false);
  showDelete = signal<boolean>(false);
  editModel = signal<AlumnoUpdatePayload>({});
  saving = signal<boolean>(false);
  deleting = signal<boolean>(false);

  openActions(a: Alumno, kind: 'view' | 'edit' | 'delete') {
    this.actionRow.set(a);
    this.openedId.set(null);
    if (kind === 'view') this.showView.set(true);
    if (kind === 'edit') {
      this.editModel.set({
        nombre: a.nombre,
        apellido: a.apellido,
        correo: a.correo,
        grado: a.grado,
        seccion: a.seccion,
      });
      this.cargarSeccionesPorGrado(a.grado);
      this.showEdit.set(true);

    }
    if (kind === 'delete') this.showDelete.set(true);
  }

  closeModals() {
    this.showView.set(false);
    this.showEdit.set(false);
    this.showDelete.set(false);
    this.actionRow.set(null);
  }

  // === Guardar edición ===
  saveEdit() {
    const row = this.actionRow();
    if (!row?.usuario_id) {
      alert('Falta usuario_id');
      return;
    }

    const id = String(row.usuario_id);
    const body: AlumnoUpdatePayload = { ...this.editModel() };
    if (!body['contraseña'] || !String(body['contraseña']).trim()) delete body['contraseña'];

    this.saving.set(true);
    this.alumnoService.updateAlumno(id, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showEdit.set(false);
          this.fetch();
        },
        error: (e) => {
          this.saving.set(false);
          console.error(e);
          alert('No se pudo actualizar.');
        },
      });
  }

  // === Eliminar ===
  confirmDelete() {
    const row = this.actionRow();
    if (!row?.usuario_id) return;
    const id = String(row.usuario_id);
    this.deleting.set(true);
    this.alumnoService.deleteAlumno(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.showDelete.set(false);
          this.alumnos.set(this.alumnos().filter(x => x.usuario_id !== row.usuario_id));
        },
        error: (e) => {
          this.deleting.set(false);
          console.error(e);
          alert('No se pudo eliminar.');
        },
      });
  }

  // === Menú ===
  openedId = signal<string | null>(null);
  toggleMenu(id: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.openedId.set(this.openedId() === id ? null : id);
  }

  @HostListener('document:click')
  onDocClick() {
    if (this.openedId()) this.openedId.set(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Estilo visual para el estado ===
  estadoPill(estado: EstadoAlumno): string {
    const e = (estado || '').toLowerCase();
    if (e === 'activo')
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    if (e === 'inactivo')
      return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
  }

  // === TrackBy para mejorar rendimiento del ngFor ===
  trackById(index: number, item: any): string {
    return item._id || index.toString();
  }

  // === Estados únicos de los alumnos (para el filtro) ===
  estados = computed(() => {
    const lista = Array.from(new Set(this.alumnos().map(a => a.estado)));
    return lista.filter(e => !!e).sort();
  });

  seccionesEdit = signal<Seccion[]>([]);
  loadingSeccionesEdit = signal<boolean>(false);


  cargarSeccionesPorGrado(gradoId: string): void {
    // al cambiar de grado, limpia la sección seleccionada
    this.editModel.update(m => ({ ...m, seccion: '' }));

    if (!gradoId) {
      this.seccionesEdit.set([]);
      return;
    }

    this.loadingSeccionesEdit.set(true);
    this.seccionService.seccionPorGrado(gradoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.seccionesEdit.set(data || []),
        error: (err) => { console.error('Error cargando secciones por grado:', err); this.seccionesEdit.set([]); },
        complete: () => this.loadingSeccionesEdit.set(false)
      });
  }




}
