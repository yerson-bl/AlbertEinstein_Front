import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminService } from 'src/app/service/admin.service';

type Estado = 'activo' | 'inactivo' | string;

export interface Admin {
  _id: string;
  apellido: string;
  contraseña_hash: string;
  correo: string;
  estado: Estado;
  fecha_creacion: string;
  nombre: string;
  rol: string;              // "Admin"
  usuario_id: string | number;
}

export type AdminUpdatePayload = {
  nombre?: string;
  apellido?: string;
  correo?: string;
  ['contraseña']?: string;  // opcional
};

type SortDir = 'asc' | 'desc';
type SortKey = keyof Pick<Admin,
  '_id' | 'apellido' | 'correo' | 'estado' | 'fecha_creacion' | 'nombre' | 'rol' | 'usuario_id'
>;

@Component({
  selector: 'app-list-admin',
  templateUrl: './list-admin.component.html',
  standalone: false,
})
export class ListAdminComponent implements OnInit {
  // estado UI
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // datos
  admins = signal<Admin[]>([]);

  // filtros
  search$ = new Subject<string>();
  search = signal<string>('');
  filtroEstado = signal<string>('');

  // orden
  sortKey = signal<SortKey>('apellido');
  sortDir = signal<SortDir>('asc');

  // paginación
  page = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizes = [10, 25, 50];

  private destroy$ = new Subject<void>();

  // opciones de estados
  estados = computed(() => Array.from(new Set(this.admins().map(a => a.estado))).sort());

  // lista filtrada + ordenada
  filteredSorted = computed<Admin[]>(() => {
    const q = this.search();
    const e = this.filtroEstado();

    let list = this.admins().filter(a => {
      const matchQ =
        !q ||
        this.hay(a.nombre, q) ||
        this.hay(a.apellido, q) ||
        this.hay(a.correo, q) ||
        this.hay(a.usuario_id, q) ||
        this.hay(`${a.apellido}, ${a.nombre}`, q);

      const matchE = !e || a.estado === e;

      return matchQ && matchE;
    });

    const key = this.sortKey();
    const dir = this.sortDir();

    list = list.sort((a, b) => {
      let va: any = a[key], vb: any = b[key];
      if (key === 'fecha_creacion') { va = new Date(va).getTime(); vb = new Date(vb).getTime(); }
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
  pageSlice = computed<Admin[]>(() => {
    const p = this.page();
    const sz = this.pageSize();
    const start = (p - 1) * sz;
    return this.filteredSorted().slice(start, start + sz);
  });

  totalFiltered = computed(() => this.filteredSorted().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(v => { this.search.set(v); this.page.set(1); });

    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getAllAdmins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: Admin[]) => {
          this.admins.set(Array.isArray(res) ? res : []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.error.set('No se pudieron cargar los administradores.');
          this.loading.set(false);
        }
      });
  }

  onSearch(v: string) { this.search$.next(v); }
  setFilterEstado(v: string) { this.filtroEstado.set(v); this.page.set(1); }
  clearFilters() { this.filtroEstado.set(''); this.search.set(''); this.page.set(1); }

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
    const d = new Date(gmt);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  estadoPill(e: Estado) {
    const isActivo = (e || '').toLowerCase() === 'activo';
    return isActivo
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  }

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

  // ===== Acciones / Modales =====
  actionRow = signal<Admin | null>(null);
  showView = signal<boolean>(false);
  showEdit = signal<boolean>(false);
  showDelete = signal<boolean>(false);
  editModel = signal<AdminUpdatePayload>({});
  saving = signal<boolean>(false);
  deleting = signal<boolean>(false);

  openActions(a: Admin, kind: 'view' | 'edit' | 'delete') {
    this.actionRow.set(a);
    this.openedId.set(null);
    if (kind === 'view') this.showView.set(true);
    if (kind === 'edit') {
      this.editModel.set({
        nombre: a.nombre,
        apellido: a.apellido,
        correo: a.correo,
      } as AdminUpdatePayload);
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

  saveEdit() {
    const row = this.actionRow();
    if (!row?.usuario_id) { alert('Falta usuario_id'); return; }

    const id = String(row.usuario_id);
    const body: AdminUpdatePayload = { ...this.editModel() };
    if (!body['contraseña'] || !String(body['contraseña']).trim()) delete body['contraseña'];

    this.saving.set(true);
    this.adminService.updateAdmin(id, body as any) // el service acepta Admin payload (ver ajuste abajo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.saving.set(false); this.showEdit.set(false); this.fetch(); },
        error: (e) => { this.saving.set(false); console.error(e); alert('No se pudo actualizar.'); }
      });
  }

  confirmDelete() {
    const row = this.actionRow();
    if (!row?.usuario_id) { alert('Falta usuario_id'); return; }

    const id = String(row.usuario_id);
    this.deleting.set(true);
    this.adminService.deleteAdmin(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.set(false); this.showDelete.set(false);
          this.admins.set(this.admins().filter(x => x.usuario_id !== row.usuario_id));
        },
        error: (e) => { this.deleting.set(false); console.error(e); alert('No se pudo eliminar.'); }
      });
  }

  // menú kebab
  openedId = signal<string | null>(null);
  toggleMenu(id: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    this.openedId.set(this.openedId() === id ? null : id);
  }
  @HostListener('document:click')
  onDocClick() { if (this.openedId()) this.openedId.set(null); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // Dentro de ListAdminComponent
  trackById(_i: number, a: Admin) {
    return a._id;
  }
}
