import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocenteService } from 'src/app/service/docente.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-new-docente',
  templateUrl: './new-docente.component.html',
  standalone: false,
})
export class NewDocenteComponent implements OnDestroy {
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
    private docenteService: DocenteService
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

    // Convertir grado y seccion a arrays para la API
    const raw = this.form.value;
    const payload = {
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      ['contraseña']: raw.contraseña,
      grado: [raw.grado],       // API espera string[]
      seccion: [raw.seccion],   // API espera string[]
    };

    this.saving = true;
    this.docenteService['http'].post('/usuarios/crear/docente', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          this.form.reset();
        },
        error: (err) => {
          this.saving = false;
          this.apiError = 'No se pudo crear el docente. Intenta nuevamente.';
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
