import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { DocenteService } from 'src/app/service/docente.service';
import { SeccionService } from 'src/app/service/seccion.service';
import Swal from 'sweetalert2'; // 👈 Importar SweetAlert2


type EstadoDocente = 'activo' | 'inactivo' | string;

export interface Docente {
  _id: string;
  apellido: string;
  contraseña_hash: string;
  correo: string;
  estado: EstadoDocente;
  fecha_creacion: string;       // GMT string
  grado: string[];              // ej. ["4","5"]
  nombre: string;
  rol: string;                  // "Docente"
  seccion: string[];            // ej. ["A","B"]
  usuario_id: string | number;  // id para PUT/DELETE
}

export type DocenteUpdatePayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  grado?: string[];       // se enviará como array
  seccion?: string[];     // se enviará como array
  ['contraseña']?: string;
};

type SortDir = 'asc' | 'desc';
type SortKey = keyof Pick<Docente, '_id' | 'apellido' | 'correo' | 'estado' | 'fecha_creacion' | 'grado' | 'nombre' | 'rol' | 'seccion' | 'usuario_id'>;

@Component({
  selector: 'app-list-docentes',
  templateUrl: './list-docentes.component.html',
  standalone: false,
})
export class ListDocentesComponent implements OnInit {
  // estado UI
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // datos
  docentes = signal<Docente[]>([]);

  // filtros
  search$ = new Subject<string>();
  search = signal<string>('');
  filtroGrado = signal<string>('');   // '' = todos
  filtroSeccion = signal<string>(''); // '' = todos
  filtroEstado = signal<string>('');  // '' = todos

  // orden
  sortKey = signal<SortKey>('apellido');
  sortDir = signal<SortDir>('asc');

  // paginación
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizes = [10, 25, 50];

  private destroy$ = new Subject<void>();

  // opciones para filtros (desde arrays)
  grados = computed(() => Array.from(
    new Set(this.docentes().flatMap(d => d.grado || []))
  ).sort((a, b) => Number(a) - Number(b)));

  secciones = computed(() => Array.from(
    new Set(this.docentes().flatMap(d => d.seccion || []))
  ).sort());

  estados = computed(() => Array.from(new Set(this.docentes().map(d => d.estado))).sort());

  // lista filtrada + ordenada
  filteredSorted = computed<Docente[]>(() => {
    const q = this.search();
    const g = this.filtroGrado();
    const s = this.filtroSeccion();
    const e = this.filtroEstado();

    let list = this.docentes().filter(d => {
      const matchQ =
        !q ||
        this.hay(d.nombre, q) ||
        this.hay(d.apellido, q) ||
        this.hay(d.correo, q) ||
        this.hay(d.usuario_id, q) ||
        this.hay(`${d.apellido}, ${d.nombre}`, q) ||
        d.grado?.some(xx => this.hay(`grado ${xx}`, q)) ||
        d.seccion?.some(xx => this.hay(`seccion ${xx}`, q)) ||
        d.grado?.some(xx => this.hay(xx, q)) ||
        d.seccion?.some(xx => this.hay(xx, q));

      const matchG = !g || (Array.isArray(d.grado) && d.grado.includes(g));
      const matchS = !s || (Array.isArray(d.seccion) && d.seccion.includes(s));
      const matchE = !e || d.estado === e;

      return matchQ && matchG && matchS && matchE;
    });

    // ordenación (grado: por primer número; seccion: por primer valor)
    const key = this.sortKey();
    const dir = this.sortDir();

    list = list.sort((a, b) => {
      let va: any = a[key], vb: any = b[key];

      if (key === 'fecha_creacion') { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
      if (key === 'grado') {
        const aa = Array.isArray(a.grado) ? Number(a.grado[0] ?? 0) : 0;
        const bb = Array.isArray(b.grado) ? Number(b.grado[0] ?? 0) : 0;
        return dir === 'asc' ? aa - bb : bb - aa;
      }
      if (Array.isArray(va)) va = (va as string[]).join(',');
      if (Array.isArray(vb)) vb = (vb as string[]).join(',');

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
  pageSlice = computed<Docente[]>(() => {
    const p = this.page();
    const sz = this.pageSize();
    const start = (p - 1) * sz;
    return this.filteredSorted().slice(start, start + sz);
  });

  totalFiltered = computed(() => this.filteredSorted().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  constructor(private docenteService: DocenteService, private seccionService: SeccionService) { }

  gradosMap = new Map<string, string>();    // id → nombre o descripción
  seccionesMap = new Map<string, string>(); // id → nombre


  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(v => { this.search.set(v); this.page.set(1); });

    // primero cargar grados y secciones
    this.cargarReferencias();
  }

  private cargarReferencias(): void {
    this.seccionService.listarGrados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (grados) => {
          grados.forEach(g => this.gradosMap.set(g._id, g.nombre || g.descripcion));
          this.cargarSecciones();
        },
        error: (e) => {
          console.error('Error cargando grados', e);
          this.toast('Error al cargar grados.', 'error');
          this.fetch();
        }
      });
  }


  private cargarSecciones(): void {
    this.seccionService.listarSecciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (secciones) => {
          secciones.forEach(s => this.seccionesMap.set(s._id, s.nombre));
          this.fetch();
        },
        error: (e) => {
          console.error('Error cargando secciones', e);
          this.toast('Error al cargar secciones.', 'error');
          this.fetch();
        }
      });
  }

  getNombreGrado(id: string): string {
    return this.gradosMap.get(id) || id;
  }

  getNombreSeccion(id: string): string {
    return this.seccionesMap.get(id) || id;
  }




  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.docenteService.getAllDocentes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: Docente[]) => {
          const list = Array.isArray(res) ? res : [];
          this.docentes.set(list);
          this.loading.set(false);

          // ✅ Toast de éxito
          this.toast(`Se cargaron ${list.length} docentes correctamente.`, 'success');
        },
        error: (err) => {
          console.error(err);
          this.error.set('No se pudieron cargar los docentes.');
          this.loading.set(false);

          // ❌ Toast de error
          this.toast('Error al cargar los docentes.', 'error');
        }
      });
  }
  // filtros / búsqueda
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

  // orden
  sortBy(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  // paginación
  goPage(delta: number) {
    const p = Math.min(Math.max(1, this.page() + delta), this.totalPages());
    this.page.set(p);
  }
  goto(p: number) {
    const safe = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(safe);
  }

  // utils
  formatDate(gmt: string): string {
    const d = new Date(gmt);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  estadoPill(e: EstadoDocente) {
    const isActivo = (e || '').toLowerCase() === 'activo';
    return isActivo
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  }

  trackById(_i: number, d: Docente) { return d._id; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

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

  // ===== Acciones y modales =====
  actionRow = signal<Docente | null>(null);
  showView = signal<boolean>(false);
  showEdit = signal<boolean>(false);
  showDelete = signal<boolean>(false);

  editModel = signal<DocenteUpdatePayload>({});
  saving = signal<boolean>(false);
  deleting = signal<boolean>(false);

  // view-model CSV para editar arrays
  gradoCsv = '';
  seccionCsv = '';

  openActions(d: Docente, kind: 'view' | 'edit' | 'delete') {
    this.actionRow.set(d);
    this.openedId.set(null);

    if (kind === 'view') this.showView.set(true);

    if (kind === 'edit') {
      this.editModel.set({
        nombre: d.nombre,
        apellido: d.apellido,
        correo: d.correo,
      } as DocenteUpdatePayload);
      this.gradoCsv = (d.grado || []).join(',');
      this.seccionCsv = (d.seccion || []).join(',');
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

  private csvToArray(csv: string): string[] {
    return (csv || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  // === Acciones ===
  saveEdit() {
    const row = this.actionRow();
    if (!row?.usuario_id) {
      this.toast('Falta usuario_id.', 'warning');
      return;
    }

    const id = String(row.usuario_id);
    const body: DocenteUpdatePayload = {
      ...this.editModel(),
      grado: this.csvToArray(this.gradoCsv),
      seccion: this.csvToArray(this.seccionCsv),
    };
    if (!body['contraseña'] || !String(body['contraseña']).trim()) delete body['contraseña'];

    this.saving.set(true);
    this.docenteService.updateDocente(id, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showEdit.set(false);
          this.fetch();
          this.toast('Docente actualizado correctamente.', 'success');
        },
        error: (e) => {
          this.saving.set(false);
          console.error(e);
          this.toast('No se pudo actualizar el docente.', 'error');
        },
      });
  }

  confirmDelete() {
    const row = this.actionRow();
    if (!row?.usuario_id) {
      this.toast('Falta usuario_id.', 'warning');
      return;
    }

    const id = String(row.usuario_id);
    this.deleting.set(true);
    this.docenteService.deleteDocente(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.showDelete.set(false);
          this.docentes.set(this.docentes().filter(x => x.usuario_id !== row.usuario_id));

          // ✅ Toast éxito
          this.toast('Docente eliminado correctamente.', 'success');
        },
        error: (e) => {
          this.deleting.set(false);
          console.error(e);

          // ❌ Toast error
          this.toast('No se pudo eliminar el docente.', 'error');
        },
      });
  }

  // === Toast reutilizable ===
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

  // Menú kebab por fila
  openedId = signal<string | null>(null);
  toggleMenu(id: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.openedId.set(this.openedId() === id ? null : id);
  }
  @HostListener('document:click')
  onDocClick() { if (this.openedId()) this.openedId.set(null); }
}
