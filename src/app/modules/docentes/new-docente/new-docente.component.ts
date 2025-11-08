import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DocenteService } from 'src/app/service/docente.service';
import { SeccionService, Grado, Seccion } from 'src/app/service/seccion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-docente',
  templateUrl: './new-docente.component.html',
  standalone: false,
})
export class NewDocenteComponent implements OnInit, OnDestroy {
  form: FormGroup;
  saving = false;
  apiError: string | null = null;
  apiOk = false;
  showPass = false;

  grados: Grado[] = [];
  secciones: Seccion[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private docenteService: DocenteService,
    private seccionService: SeccionService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.maxLength(80)]],
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      grado: ['', [Validators.required]],
      seccion: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Cargar grados iniciales
    this.cargarGrados();

    // Cuando cambia el grado → cargar secciones relacionadas
    this.form.get('grado')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((gradoId) => {
        if (gradoId) {
          this.cargarSeccionesPorGrado(gradoId);
        } else {
          this.secciones = [];
          this.form.get('seccion')?.reset();
        }
      });
  }

  // === Cargar grados desde el servicio ===
  cargarGrados(): void {
    this.seccionService
      .listarGrados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => (this.grados = data || []),
        error: (err) => console.error('Error cargando grados:', err),
      });
  }

  // === Cargar secciones según grado seleccionado ===
  cargarSeccionesPorGrado(gradoId: string): void {
    this.seccionService
      .seccionPorGrado(gradoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => (this.secciones = data || []),
        error: (err) => console.error('Error cargando secciones:', err),
      });
  }

  get f() {
    return this.form.controls;
  }

  isInvalid(ctrl: string) {
    const c = this.f[ctrl];
    return c.invalid && (c.touched || c.dirty);
  }

  // === Enviar formulario ===
  submit(): void {
    this.apiError = null;
    this.apiOk = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast('Completa todos los campos requeridos', 'warning');
      return;
    }

    const raw = this.form.value;

    // Buscar los objetos completos seleccionados
    const gradoSel = this.grados.find((g) => g._id === raw.grado);
    const seccionSel = this.secciones.find((s) => s._id === raw.seccion);

    // Crear payload con id + nombre (igual que en alumnos)
    const payload = {
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      contraseña: raw.contraseña,
      grado: [
        {
          id: gradoSel?._id || raw.grado,
          nombre: gradoSel?.nombre || gradoSel?.descripcion || '',
        },
      ],
      seccion: [
        {
          id: seccionSel?._id || raw.seccion,
          nombre: seccionSel?.nombre || '',
        },
      ],
    };

    this.saving = true;

    this.docenteService['http']
      .post('/usuarios/crear/docente', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          this.form.reset();
          this.toast('Docente creado correctamente', 'success');
        },
        error: (err) => {
          this.saving = false;
          this.apiError = 'No se pudo crear el docente. Intenta nuevamente.';
          console.error(err);
          this.toast('No se pudo crear el docente', 'error');
        },
      });
  }

  reset(): void {
    this.form.reset();
    this.apiError = null;
    this.apiOk = false;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
