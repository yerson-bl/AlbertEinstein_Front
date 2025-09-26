import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlumnoService } from 'src/app/service/alumno.service';
import { UsuarioCreate } from 'src/app/models/backend.models';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-alumno',
  templateUrl: './new-alumno.component.html',
  standalone: false,
})
export class NewAlumnoComponent implements OnDestroy {
  form: FormGroup;
  saving = false;
  apiError: string | null = null;
  apiOk = false;
  showPass = false;

  grados = ['1','2','3','4','5','6'];
  secciones = ['A','B','C','D','E','F'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private alumnoService: AlumnoService,
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

  get f() { return this.form.controls; }
  isInvalid(ctrl: string) { const c = this.f[ctrl]; return c.invalid && (c.touched || c.dirty); }

  submit(): void {
    this.apiError = null;
    this.apiOk = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: UsuarioCreate = this.form.value; // {nombre, apellido, correo, contraseña, grado, seccion}

    this.saving = true;
    this.alumnoService.crearAlumno(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          // Limpia el formulario (mantén selección si quieres)
          this.form.reset();
        },
        error: (err) => {
          this.saving = false;
          this.apiError = 'No se pudo crear el alumno. Intenta nuevamente.';
          console.error(err);
        }
      });
  }

  reset(): void {
    this.form.reset();
    this.apiError = null;
    this.apiOk = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }
}
