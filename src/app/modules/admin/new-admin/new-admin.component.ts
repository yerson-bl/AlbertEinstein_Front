import { Component, OnDestroy } from '@angular/core';
import { AdminService } from 'src/app/service/admin.service';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


type AdminCreatePayload = {
  usuario_id: string | number;
  nombre: string;
  apellido: string;
  correo: string;
  ['contraseña']: string;
};

@Component({
  selector: 'app-new-admin',
  templateUrl: './new-admin.component.html',
  standalone: false,
})
export class NewAdminComponent implements OnDestroy {
  form: FormGroup;
  saving = false;
  apiError: string | null = null;
  apiOk = false;
  showPass = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.form = this.fb.group({
      usuario_id: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.maxLength(80)]],
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
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

    // La API acepta usuario_id como string o número (en Postman lo envías como string).
    const raw = this.form.value;
    const payload: AdminCreatePayload = {
      usuario_id: String(raw.usuario_id).trim(),
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      ['contraseña']: raw.contraseña,
    };

    this.saving = true;

    // Si tu AdminService ya tiene crearAdmin, úsalo aquí.
    // Asegúrate de que el método apunte a POST /usuarios/crear/admin
    this.adminService.crearAdmin(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          this.form.reset();
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.apiError = 'No se pudo crear el admin. Intenta nuevamente.';
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
