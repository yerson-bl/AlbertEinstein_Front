import { Component, OnDestroy } from '@angular/core';
import { AdminService } from 'src/app/service/admin.service';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2'; // 👈 Importación del toast SweetAlert2

type AdminCreatePayload = {
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
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.maxLength(80)]],
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
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
    const payload: AdminCreatePayload = {
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      ['contraseña']: raw.contraseña,
    };

    this.saving = true;

    this.adminService.crearAdmin(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.apiOk = true;
          this.form.reset();

          // ✅ Toast de éxito
          this.toast(`Administrador ${raw.nombre} ${raw.apellido} creado correctamente`, 'success');
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.apiError = 'No se pudo crear el administrador. Intenta nuevamente.';

          // ❌ Toast de error
          this.toast('No se pudo crear el administrador', 'error');
        }
      });
  }

  reset(): void {
    this.form.reset();
    this.apiError = null;
    this.apiOk = false;
  }

  // 🔔 Toast reutilizable (idéntico a los otros componentes)
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
