import { Component, OnInit, signal, computed } from '@angular/core';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { HostListener } from '@angular/core';
import { AlumnoService } from 'src/app/service/alumno.service';

type EstadoAlumno = 'activo' | 'inactivo' | string;

export interface Alumno {
  _id: string;
  apellido: string;
  contraseña_hash: string;
  correo: string;
  estado: EstadoAlumno;
  fecha_creacion: string; // GMT string
  grado: string;          // "1".."6", etc.
  nombre: string;
  rol: string;            // "Alumno"
  seccion: string;        // "A".."F"
  usuario_id: string | number;   // 👈 puede ser número
}

// Debajo de tus interfaces:
export type AlumnoUpdatePayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  grado?: string;
  seccion?: string;
  ['contraseña']?: string;   // 👈 el backend la espera con acento
};


type SortDir = 'asc' | 'desc';
type SortKey = keyof Pick<Alumno, '_id' | 'apellido' | 'correo' | 'estado' | 'fecha_creacion' | 'grado' | 'nombre' | 'rol' | 'seccion' | 'usuario_id'>;

@Component({
  selector: 'app-list-alumnos',
  templateUrl: './list-alumnos.component.html',
  standalone: false,
})
export class ListAlumnosComponent implements OnInit {
  // estado UI
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // datos
  alumnos = signal<Alumno[]>([]);

  // filtros
  search$ = new Subject<string>();
  search = signal<string>('');
  filtroGrado = signal<string>('');   // '' = todos
  filtroSeccion = signal<string>('');   // '' = todos
  filtroEstado = signal<string>('');   // '' = todos

  // orden
  sortKey = signal<SortKey>('apellido');
  sortDir = signal<SortDir>('asc');

  // paginación
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizes = [10, 25, 50];

  private destroy$ = new Subject<void>();

  // opciones de filtros (calculadas desde los datos)
  grados = computed(() => Array.from(new Set(this.alumnos().map(a => a.grado))).sort());
  secciones = computed(() => Array.from(new Set(this.alumnos().map(a => a.seccion))).sort());
  estados = computed(() => Array.from(new Set(this.alumnos().map(a => a.estado))).sort());

  // lista filtrada + ordenada
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
        this.hay(a.usuario_id, q) ||
        this.hay(`${a.apellido}, ${a.nombre}`, q) ||
        this.hay(`grado ${a.grado}`, q) ||          // 👈 incluye grado
        this.hay(`seccion ${a.seccion}`, q) ||      // 👈 incluye sección
        this.hay(a.seccion, q) ||                   // por si escribe “A”
        this.hay(a.grado, q);                       // por si escribe “3”

      const matchG = !g || a.grado === g;
      const matchS = !s || a.seccion === s;
      const matchE = !e || a.estado === e;

      return matchQ && matchG && matchS && matchE;
    });

    // …(deja tu ordenado igual)…
    const key = this.sortKey();
    const dir = this.sortDir();
    list = list.sort((a, b) => {
      let va: any = a[key], vb: any = b[key];
      if (key === 'fecha_creacion') { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      if (key === 'grado') { va = Number(va); vb = Number(vb); }
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = this.norm(va).localeCompare(this.norm(vb), undefined, { numeric: true, sensitivity: 'base' });
        return dir === 'asc' ? cmp : -cmp;
      }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  });


  // página actual
  pageSlice = computed<Alumno[]>(() => {
    const p = this.page();
    const sz = this.pageSize();
    const start = (p - 1) * sz;
    return this.filteredSorted().slice(start, start + sz);
  });

  totalFiltered = computed(() => this.filteredSorted().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  constructor(private alumnoService: AlumnoService) { }

  ngOnInit(): void {
    // búsqueda con debounce
    this.search$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(v => { this.search.set(v); this.page.set(1); });

    // carga
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.alumnoService.getAllAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: Alumno[]) => {
          this.alumnos.set(Array.isArray(res) ? res : []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('No se pudieron cargar los alumnos.');
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  onSearch(v: string) { this.search$.next(v); }

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

  sortBy(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  goPage(delta: number) {
    const p = Math.min(Math.max(1, this.page() + delta), this.totalPages());
    this.page.set(p);
  }

  goto(p: number) {
    const safe = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(safe);
  }

  formatDate(gmt: string): string {
    // muestra en local corto
    const d = new Date(gmt);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    // si quieres zona Lima fija: usar Intl.DateTimeFormat con timeZone: 'America/Lima'
  }

  estadoPill(e: EstadoAlumno) {
    const isActivo = (e || '').toLowerCase() === 'activo';
    return isActivo
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  }

  trackById(_i: number, a: Alumno) { return a._id; }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }

  // Reemplaza tus helpers por estos:
  private norm(v: string | number | null | undefined): string {
    return String(v ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hay(texto: string | number | null | undefined, q: string): boolean {
    return this.norm(texto).includes(this.norm(q));
  }
  // ====== YA LO TENÍAS (resumen): acciones y modales ======
  actionRow = signal<Alumno | null>(null);
  showView = signal<boolean>(false);
  showEdit = signal<boolean>(false);
  showDelete = signal<boolean>(false);
  editModel = signal<AlumnoUpdatePayload>({});
  saving = signal<boolean>(false);
  deleting = signal<boolean>(false);

  // abrir menú-acción
  openActions(a: Alumno, kind: 'view' | 'edit' | 'delete') {
    this.actionRow.set(a);
    this.openedId.set(null); // cierra el menú
    if (kind === 'view') this.showView.set(true);
    if (kind === 'edit') {
      this.editModel.set({
        nombre: a.nombre,
        apellido: a.apellido,
        correo: a.correo,
        grado: a.grado,
        seccion: a.seccion,
      } as AlumnoUpdatePayload);
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

  // ======= guardar edición =======
  saveEdit() {
    const row = this.actionRow();
    if (!row?.usuario_id) { alert('Falta usuario_id'); return; }

    const id = String(row.usuario_id);                 // 👈 usar usuario_id
    const body: AlumnoUpdatePayload = { ...this.editModel() };
    if (!body['contraseña'] || !String(body['contraseña']).trim()) delete body['contraseña'];

    this.saving.set(true);
    this.alumnoService.updateAlumno(id, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.saving.set(false); this.showEdit.set(false); this.fetch(); },
        error: (e) => { this.saving.set(false); console.error(e); alert('No se pudo actualizar.'); }
      });
  }

  confirmDelete() {
    const row = this.actionRow();
    if (!row?.usuario_id) { alert('Falta usuario_id'); return; }

    const id = String(row.usuario_id);                 // 👈 usar usuario_id
    this.deleting.set(true);
    this.alumnoService.deleteAlumno(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false); this.showDelete.set(false);
          this.alumnos.set(this.alumnos().filter(x => x.usuario_id !== row.usuario_id));
        },
        error: (e) => { this.deleting.set(false); console.error(e); alert('No se pudo eliminar.'); }
      });
  }

  // ====== NUEVO: control del menú (kebab) por fila ======
  openedId = signal<string | null>(null);
  toggleMenu(id: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.openedId.set(this.openedId() === id ? null : id);
  }
  @HostListener('document:click')
  onDocClick() {
    // cierra cualquier menú al hacer click fuera
    if (this.openedId()) this.openedId.set(null);
  }


}
