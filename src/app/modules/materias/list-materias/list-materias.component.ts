import {
  Component,
  OnInit,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import {
  Materia,
  MateriaCreatePayload,
  MateriaService,
} from 'src/app/service/materia.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

type SortDir = 'asc' | 'desc';
type SortKey = keyof Pick<Materia, '_id' | 'nombre' | 'materia_id' | 'estado'>;

@Component({
  selector: 'app-list-materias',
  templateUrl: './list-materias.component.html',
  standalone: false,
})
export class ListMateriasComponent implements OnInit {
  // Estado
  loading = signal(true);
  error = signal<string | null>(null);

  // Datos
  materias = signal<Materia[]>([]);

  // Filtros
  search$ = new Subject<string>();
  search = signal('');
  filtroEstado = signal('');

  // Orden
  sortKey = signal<SortKey>('nombre');
  sortDir = signal<SortDir>('asc');

  // Paginación
  page = signal(1);
  pageSize = signal(10);
  pageSizes = [10, 25, 50];

  private destroy$ = new Subject<void>();

  // Estados únicos
  estados = computed(() =>
    Array.from(new Set(this.materias().map((m) => m.estado)))
  );

  // Búsqueda + filtros + ordenamiento
  filteredSorted = computed<Materia[]>(() => {
    const q = this.search();
    const e = this.filtroEstado();

    let list = this.materias().filter((m) => {
      const matchQ = !q || this.hay(m.nombre, q);
      const matchE = !e || m.estado === e;
      return matchQ && matchE;
    });

    // Sorting
    const key = this.sortKey();
    const dir = this.sortDir();

    return list.sort((a, b) => {
      let va: any = a[key],
        vb: any = b[key];

      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = this.norm(va).localeCompare(this.norm(vb));
        return dir === 'asc' ? cmp : -cmp;
      }

      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // Paginación
  pageSlice = computed(() => {
    const p = this.page();
    const sz = this.pageSize();
    const start = (p - 1) * sz;
    return this.filteredSorted().slice(start, start + sz);
  });

  totalFiltered = computed(() => this.filteredSorted().length);
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize()))
  );

  constructor(private materiaService: MateriaService) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe((v) => {
        this.search.set(v);
        this.page.set(1);
      });

    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    this.materiaService.listarMateria().subscribe({
      next: (res) => {
        this.materias.set(res);
        this.loading.set(false);
        this.toast(`Se cargaron ${res.length} materias.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.error.set('No se pudieron cargar las materias.');
        this.loading.set(false);
        this.toast('Error cargando materias.', 'error');
      },
    });
  }

  // === FILTROS ===
  onSearch(v: string) {
    this.search$.next(v);
  }

  setFilterEstado(value: string) {
    this.filtroEstado.set(value);
    this.page.set(1);
  }

  clearFilters() {
    this.filtroEstado.set('');
    this.search.set('');
    this.page.set(1);
  }

  // === ORDEN ===
  sortBy(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  // === PAGINACIÓN ===
  goPage(delta: number) {
    const p = Math.min(
      Math.max(1, this.page() + delta),
      this.totalPages()
    );
    this.page.set(p);
  }

  goto(p: number) {
    const safe = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(safe);
  }

  // === HELPERS ===
  private norm(v: string | null | undefined): string {
    return (
      (v ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );
  }

  private hay(t: string | null | undefined, q: string): boolean {
    return this.norm(t).includes(this.norm(q));
  }

  trackById(_i: number, m: Materia) {
    return m._id;
  }

  estadoPill(e: string) {
    return e === 'activo'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  }

  // === MENÚ / MODALES ===
  openedId = signal<string | null>(null);

  toggleMenu(id: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.openedId.set(this.openedId() === id ? null : id);
  }

  @HostListener('document:click')
  onDocClick() {
    if (this.openedId()) this.openedId.set(null);
  }

  showCreate = signal(false);
  showEdit = signal(false);
  showDelete = signal(false);

  actionRow = signal<Materia | null>(null);
  saving = signal(false);
  deleting = signal(false);

  createModel = signal<MateriaCreatePayload>({ nombre: '' });
  editModel = signal<MateriaCreatePayload>({ nombre: '' });

  // === Crear
  openCreate() {
    this.createModel.set({ nombre: '' });
    this.showCreate.set(true);
  }

  saveCreate() {
    const body = this.createModel();
    const nombre = (body.nombre || '').trim();

    if (!nombre) {
      this.toast('El nombre es obligatorio.', 'warning');
      return;
    }

    this.saving.set(true);
    this.materiaService.crearMateria({ nombre }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreate.set(false);
        this.fetch();
        this.toast(`Materia "${nombre}" creada.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.saving.set(false);
        this.toast('No se pudo crear la materia.', 'error');
      },
    });
  }

  // === Editar
  openEdit(m: Materia) {
    this.actionRow.set(m);
    this.editModel.set({ nombre: m.nombre });
    this.showEdit.set(true);
  }

  saveEdit() {
    const m = this.actionRow();
    if (!m) return;

    const id = m.materia_id; // ⚠️ TU API RECIBE EL ID NUMÉRICO
    const body = this.editModel();

    this.saving.set(true);
    this.materiaService.actualizarMateria(id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEdit.set(false);
        this.fetch();
        this.toast(`Materia "${body.nombre}" actualizada.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.saving.set(false);
        this.toast('No se pudo actualizar.', 'error');
      },
    });
  }

  // === Eliminar
  openDelete(m: Materia) {
    this.actionRow.set(m);
    this.showDelete.set(true);
  }

  confirmDelete() {
    const m = this.actionRow();
    if (!m) return;

    const id = m.materia_id;

    this.deleting.set(true);
    this.materiaService.eliminarMateria(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDelete.set(false);
        this.fetch();
        this.toast(`Materia "${m.nombre}" eliminada.`, 'success');
      },
      error: (e) => {
        console.error(e);
        this.deleting.set(false);
        this.toast('No se pudo eliminar.', 'error');
      },
    });
  }

  closeModals() {
    this.showCreate.set(false);
    this.showEdit.set(false);
    this.showDelete.set(false);
    this.actionRow.set(null);
  }

  // === TOAST
  private toast(
    msg: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) {
    const t = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: { popup: 'colored-toast' },
    });
    t.fire({ icon, title: msg });
  }
}
