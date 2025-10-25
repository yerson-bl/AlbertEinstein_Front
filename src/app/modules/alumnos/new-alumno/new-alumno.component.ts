import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlumnoService } from 'src/app/service/alumno.service';
import { SeccionService, Grado, Seccion } from 'src/app/service/seccion.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // 👈 Importamos SweetAlert2

@Component({
  selector: 'app-new-alumno',
  templateUrl: './new-alumno.component.html',
  standalone: false,
})
export class NewAlumnoComponent implements OnInit, OnDestroy {
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
    private alumnoService: AlumnoService,
    private seccionService: SeccionService,
    private router: Router
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
    this.cargarGrados();

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

  cargarGrados(): void {
    this.seccionService.listarGrados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.grados = data,
        error: (err) => console.error('Error cargando grados:', err)
      });
  }

  cargarSeccionesPorGrado(gradoId: string): void {
    this.seccionService.seccionPorGrado(gradoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.secciones = data,
        error: (err) => console.error('Error cargando secciones:', err)
      });
  }

  get f() { return this.form.controls; }

  isInvalid(ctrl: string) {
    const c = this.f[ctrl];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.apiError = null;
    this.apiOk = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast('Completa todos los campos requeridos', 'warning');
      return;
    }

    const raw = this.form.value;
    const payload = {
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      ['contraseña']: raw.contraseña,
      grado: [raw.grado],
      seccion: [raw.seccion],
    };

    this.saving = true;
    this.alumnoService.crearAlumno(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          this.form.reset();

          // ✅ Toast de éxito
          this.toast(`Alumno ${raw.nombre} ${raw.apellido} creado correctamente`, 'success');
        },
        error: (err) => {
          this.saving = false;
          this.apiError = 'No se pudo crear el alumno. Intenta nuevamente.';
          console.error(err);

          // ❌ Toast de error
          this.toast('No se pudo crear el alumno', 'error');
        }
      });
  }

  reset(): void {
    this.form.reset();
    this.apiError = null;
    this.apiOk = false;
  }

  // 🔔 Método Toast reutilizable
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
