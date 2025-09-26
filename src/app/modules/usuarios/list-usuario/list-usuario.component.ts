// src/app/pages/usuarios/list-usuario/list-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { UsuarioService } from 'src/app/service/usuario.service';
import { FormBuilder, FormGroup } from '@angular/forms';

type RolUsuario = 'Alumno' | 'Docente' | 'Administrador' | string;

@Component({
  selector: 'app-list-usuario',
  templateUrl: './list-usuario.component.html',
  styleUrls: ['./list-usuario.component.css'],
  standalone: false
})
export class ListUsuarioComponent implements OnInit {

  isLoading = false;
  usuarios: any[] = [];
  filtered: any[] = [];

  // filtros
  filtroForm!: FormGroup;
  grados: (number | string)[] = [1, 2, 3, 4, 5, 6];
  secciones: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  roles: RolUsuario[] = ['Alumno', 'Docente', 'Administrador'];

  // paginación local
  page = 1;
  pageSize = 10;

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.filtroForm = this.fb.group({
      q: [''],
      rol: [''],
      grado: [''],
      seccion: ['']
    });

    // this.cargarUsuarios();

    // re-aplicar filtros al cambiar el formulario
    this.filtroForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  // cargarUsuarios(): void {
  //   this.isLoading = true;
  //   this.usuarioService.getUsuarios().subscribe({
  //     next: (data: any[]) => {
  //       // Estructura esperada de cada usuario (según tu POST):
  //       // { usuario_id, nombre, apellido, correo, rol, grado, seccion, ... }
  //       this.usuarios = Array.isArray(data) ? data : (data?.data ?? []);
  //       this.filtered = [...this.usuarios];
  //       this.page = 1;
  //       this.isLoading = false;
  //     },
  //     error: () => {
  //       this.isLoading = false;
  //       alert('Error al cargar usuarios');
  //     }
  //   });
  // }

  aplicarFiltros(): void {
    const { q, rol, grado, seccion } = this.filtroForm.value;
    const term = (q || '').toString().trim().toLowerCase();

    this.filtered = this.usuarios.filter(u => {
      const matchesText =
        !term ||
        (u.nombre?.toLowerCase().includes(term)) ||
        (u.apellido?.toLowerCase().includes(term)) ||
        (u.correo?.toLowerCase().includes(term)) ||
        (u.usuario_id?.toLowerCase().includes(term));

      const matchesRol = !rol || u.rol === rol;
      const matchesGrado = !grado || String(u.grado) === String(grado);
      const matchesSeccion = !seccion || u.seccion === seccion;

      return matchesText && matchesRol && matchesGrado && matchesSeccion;
    });

    this.page = 1; // reset página al filtrar
  }

  // Helpers UI
  totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  canPrev(): boolean {
    return this.page > 1;
  }
  canNext(): boolean {
    return this.page < this.totalPages();
  }
  goPrev(): void {
    if (this.canPrev()) this.page--;
  }
  goNext(): void {
    if (this.canNext()) this.page++;
  }
  pageSlice(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  nombreCompleto(u: any): string {
    return [u.nombre, u.apellido].filter(Boolean).join(' ');
  }

  // placeholder para navegar al registro (ajusta tu ruta real)
  registrarRuta(): string {
    // por ejemplo: '/usuarios/registrar'
    return '/usuarios/new-usuario';
  }
}
