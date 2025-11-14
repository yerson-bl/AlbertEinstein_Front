import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlumnoService } from 'src/app/service/alumno.service';
import { SeccionService, Grado, Seccion } from 'src/app/service/seccion.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserStorage } from 'src/app/utils/user.storage.util';

@Component({
  selector: 'app-new-alumno-docente',
  standalone: false,
  templateUrl: './new-alumno-docente.component.html',
  styleUrl: './new-alumno-docente.component.css'
})
export class NewAlumnoDocenteComponent implements OnInit, OnDestroy {
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
  const user = UserStorage.getUser();
  if (!user) return;

  // 👇 Normalizamos grado y sección, vengan como string, objeto o array
  const gradoRaw: any = (user as any).grado;
  const seccionRaw: any = (user as any).seccion;

  console.log('🧩 GRADO crudo desde localStorage:', gradoRaw);
  console.log('🧩 SECCIÓN cruda desde localStorage:', seccionRaw);

  const gradoId =
    Array.isArray(gradoRaw) ? gradoRaw[0]?.id :
    (typeof gradoRaw === 'object' && gradoRaw !== null) ? gradoRaw.id :
    gradoRaw;

  const seccionId =
    Array.isArray(seccionRaw) ? seccionRaw[0]?.id :
    (typeof seccionRaw === 'object' && seccionRaw !== null) ? seccionRaw.id :
    seccionRaw;

  console.log('🎯 ID real de GRADO que se usará:', gradoId);
  console.log('🎯 ID real de SECCIÓN que se usará:', seccionId);

  // Prellenar selects con el ID ya normalizado
  this.form.patchValue({
    grado: gradoId,
    seccion: seccionId
  });

  // Bloquear selects
  this.form.get('grado')?.disable();
  this.form.get('seccion')?.disable();

  // 🟦 Cargar grados (y filtrar solo el del docente)
  this.seccionService.listarGrados()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.grados = data.filter(g => g._id === gradoId);
        console.log('📘 Grado encontrado en API:', this.grados);

        // Cargar secciones del grado
        this.seccionService.seccionPorGrado(String(gradoId))
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (secs) => {
              this.secciones = secs.filter(s => s._id === seccionId);
              console.log('📙 Sección encontrada en API:', this.secciones);
            },
            error: (err) => {
              console.error('❌ Error cargando secciones:', err);
            }
          });
      },
      error: (err) => {
        console.error('❌ Error cargando grados:', err);
      }
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

    // Como están disabled, los valores se obtienen así:
    const gradoId = this.form.get('grado')?.value;
    const seccionId = this.form.get('seccion')?.value;

    const gradoSel = this.grados.find(g => g._id === gradoId);
    const seccionSel = this.secciones.find(s => s._id === seccionId);

    const raw = this.form.value;

    const payload = {
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      contraseña: raw.contraseña,
      grado: {
        id: gradoSel?._id,
        nombre: gradoSel?.nombre
      },
      seccion: {
        id: seccionSel?._id,
        nombre: seccionSel?.nombre
      }
    };

    this.saving = true;
    this.alumnoService.crearAlumno(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          this.form.reset();
          this.toast(`Alumno ${raw.nombre} ${raw.apellido} creado correctamente`, 'success');
        },
        error: (err) => {
          this.saving = false;
          this.apiError = 'No se pudo crear el alumno. Intenta nuevamente.';
          console.error(err);
          this.toast('No se pudo crear el alumno', 'error');
        }
      });
  }

  reset(): void {
    this.form.reset();
    this.apiError = null;
    this.apiOk = false;
  }

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
