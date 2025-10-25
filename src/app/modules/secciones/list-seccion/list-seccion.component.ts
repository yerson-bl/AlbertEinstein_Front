import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { SeccionService, Seccion, SeccionCreatePayload, Grado } from 'src/app/service/seccion.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

type SortDir = 'asc' | 'desc';
type SortKey = keyof Pick<Seccion, '_id' | 'nombre' | 'grado_id' | 'estado'>;

@Component({
  selector: 'app-list-seccion',
  templateUrl: './list-seccion.component.html',
  standalone: false,
})
export class ListSeccionComponent implements OnInit {
  // --- Estado general ---
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // --- Datos ---
  seccion = signal<Seccion[]>([]);
  grados = signal<Grado[]>([]);

  // --- Filtros ---
  search$ = new Subject<string>();
  search = signal<string>('');
  filtroGrado = signal<string>('');
  filtroEstado = signal<string>('');

  // --- Orden ---
  sortKey = signal<SortKey>('nombre');
  sortDir = signal<SortDir>('asc');

  // --- Paginación ---
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizes = [10, 25, 50];

  private destroy$ = new Subject<void>();

  // --- Datos calculados ---
  gradosUnicos = computed(() =>
    Array.from(new Set(this.seccion().map(s => s.grado_id))).sort()
  );

  estados = computed(() =>
    Array.from(new Set(this.seccion().map(s => (s.estado ? 'activo' : 'inactivo'))))
  );

  filteredSorted = computed<Seccion[]>(() => {
    const q = this.search();
    const g = this.filtroGrado();
    const e = this.filtroEstado();

    let list = this.seccion().filter(s => {
      const matchQ = !q || this.hay(s.nombre, q);
      const matchG = !g || s.grado_id === g;
      const matchE = !e || (s.estado ? 'activo' : 'inactivo') === e;
      return matchQ && matchG && matchE;
    });

    const key = this.sortKey();
    const dir = this.sortDir();

    return list.sort((a, b) => {
      let va: any = a[key], vb: any = b[key];
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = this.norm(va).localeCompare(this.norm(vb));
        return dir === 'asc' ? cmp : -cmp;
      }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // --- Paginación ---
  pageSlice = computed(() => {
    const p = this.page();
    const sz = this.pageSize();
    const start = (p - 1) * sz;
    return this.filteredSorted().slice(start, start + sz);
  });

  totalFiltered = computed(() => this.filteredSorted().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  constructor(private seccionService: SeccionService) { }

  ngOnInit(): void {
    this.search$.pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(v => { this.search.set(v); this.page.set(1); });
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.seccionService.listarSecciones().subscribe({
      next: (res: Seccion[]) => {
        this.seccion.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudieron cargar las secciones.');
        this.loading.set(false);
        this.toast('Error al cargar las secciones', 'error');
      }
    });

    this.seccionService.listarGrados().subscribe({
      next: (res: Grado[]) => this.grados.set(res),
      error: (err) => console.error('Error cargando grados', err)
    });
  }

  // --- Filtros ---
  onSearch(v: string) { this.search$.next(v); }

  setFilter(kind: 'grado' | 'estado', value: string) {
    if (kind === 'grado') this.filtroGrado.set(value);
    if (kind === 'estado') this.filtroEstado.set(value);
    this.page.set(1);
  }

  clearFilters() {
    this.filtroGrado.set('');
    this.filtroEstado.set('');
    this.search.set('');
    this.page.set(1);
  }

  // --- Orden ---
  sortBy(key: SortKey) {
    if (this.sortKey() === key)
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  // --- Paginación ---
  goPage(delta: number) {
    const p = Math.min(Math.max(1, this.page() + delta), this.totalPages());
    this.page.set(p);
  }

  goto(p: number) {
    const safe = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(safe);
  }

  // --- Helpers ---
  private norm(v: string | null | undefined): string {
    return (v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private hay(t: string | null | undefined, q: string): boolean {
    return this.norm(t).includes(this.norm(q));
  }

  trackById(_i: number, s: Seccion) { return s._id; }
  formatEstado(e: boolean) { return e ? 'Activo' : 'Inactivo'; }
  estadoPill(e: boolean) {
    return e
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  }

  // --- Acciones / modales ---
  openedId = signal<string | null>(null);
  toggleMenu(id: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.openedId.set(this.openedId() === id ? null : id);
  }

  @HostListener('document:click')
  onDocClick() {
    if (this.openedId()) this.openedId.set(null);
  }

  showView = signal<boolean>(false);
  showCreate = signal<boolean>(false);
  showEdit = signal<boolean>(false);
  showDelete = signal<boolean>(false);
  actionRow = signal<Seccion | null>(null);
  saving = signal<boolean>(false);
  deleting = signal<boolean>(false);

  createModel = signal<SeccionCreatePayload>({ nombre: '', grado_id: '' });
  editModel = signal<SeccionCreatePayload>({ nombre: '', grado_id: '' });

  // === Crear ===
  openCreate() {
    this.createModel.set({ nombre: '', grado_id: '' });
    this.showCreate.set(true);
  }

  saveCreate() {
    const body = this.createModel();
    const nombre = (body.nombre || '').trim();

    if (!/^[A-Za-z]$/.test(nombre)) {
      this.toast('El nombre de la sección debe ser una sola letra (A-Z).', 'warning');
      return;
    }

    body.nombre = nombre.toUpperCase();

    if (!body.grado_id) {
      this.toast('Selecciona un grado.', 'warning');
      return;
    }

    this.saving.set(true);
    this.seccionService.crearSeccion(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreate.set(false);
        this.fetch();
        this.toast(`Sección "${body.nombre}" creada correctamente.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.saving.set(false);
        this.toast('No se pudo crear la sección.', 'error');
      }
    });
  }

  // === Editar ===
  openActions(s: Seccion, kind: 'view' | 'edit' | 'delete') {
    this.actionRow.set(s);
    this.openedId.set(null);
    if (kind === 'view') this.showView.set(true);
    if (kind === 'edit') this.openEdit(s);
    if (kind === 'delete') this.openDelete(s);
  }

  openEdit(s: Seccion) {
    this.actionRow.set(s);
    this.editModel.set({ nombre: s.nombre, grado_id: s.grado_id });
    this.showEdit.set(true);
  }

  saveEdit() {
    const s = this.actionRow();
    if (!s) return;
    const id = s._id;
    const body = this.editModel();

    this.saving.set(true);
    this.seccionService.actualizarSeccion(id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEdit.set(false);
        this.fetch();
        this.toast(`Sección "${body.nombre}" actualizada correctamente.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.saving.set(false);
        this.toast('No se pudo actualizar la sección.', 'error');
      }
    });
  }

  // === Eliminar ===
  openDelete(s: Seccion) {
    this.actionRow.set(s);
    this.showDelete.set(true);
  }

  confirmDelete() {
    const s = this.actionRow();
    if (!s) return;
    this.deleting.set(true);
    this.seccionService.eliminarSeccion(s._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDelete.set(false);
        this.fetch();
        this.toast(`Sección "${s.nombre}" eliminada correctamente.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.deleting.set(false);
        this.toast('No se pudo eliminar la sección.', 'error');
      }
    });
  }

  closeModals() {
    this.showCreate.set(false);
    this.showEdit.set(false);
    this.showDelete.set(false);
    this.actionRow.set(null);
  }

  getNombreGrado(grado_id: string): string {
    const g = this.grados().find(gr => gr._id === grado_id);
    return g ? `${g.nombre} - ${g.descripcion}` : '-';
  }

  // === TOAST SweetAlert2 (mismo que en new-evaluacion) ===
  private toast(msg: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
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
