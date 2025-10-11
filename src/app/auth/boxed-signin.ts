import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment.prod';
import Swal from 'sweetalert2';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginService } from 'src/app/service/login.service';


type Lang = { code: string; label: string; name?: string };

@Component({
  templateUrl: './boxed-signin.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    :host { display: block; animation: fadeUp .35s ease-out both; }
  `]
})
export class BoxedSigninComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly STORAGE_KEY = 'sge_email';

  // UI / estado
  isSubmitting = false;
  passMode: 'password' | 'text' = 'password';
  capsLockOn = false;

  // Form
  loginForm!: FormGroup;

  // Meta
  readonly version = environment.version;
  readonly currentYear = new Date().getFullYear();



  constructor(
    private readonly translate: TranslateService,
    private readonly store: Store<any>,
    private readonly router: Router,
    private readonly appSetting: AppService,
    private readonly fb: FormBuilder,
    private readonly loginSrv: LoginService
  ) { }

  // Getters de control (evita acceder por string en template)
  get emailCtrl() { return this.loginForm.get('email')!; }
  get passwordCtrl() { return this.loginForm.get('password')!; }

  ngOnInit(): void {


    // form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // prefill recordar
    const savedEmail = localStorage.getItem(this.STORAGE_KEY);
    if (savedEmail) this.loginForm.patchValue({ email: savedEmail, rememberMe: true });

    // (opcional) escuchar algo del store si lo necesitas
    // this.store.select(s => s.index).pipe(takeUntil(this.destroy$)).subscribe();

    // no más lógica pesada en init
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePasswordMode(): void {
    this.passMode = this.passMode === 'password' ? 'text' : 'password';
  }

  handleCapsLock(event: KeyboardEvent): void {
    this.capsLockOn = typeof event.getModifierState === 'function' ? event.getModifierState('CapsLock') : false;
  }

  changeLanguage(item: Lang): void {
    this.translate.use(item.code);
    this.appSetting.toggleLanguage(item);
    // Mantengo tu comportamiento previo
    this.store.dispatch({ type: 'toggleRTL', payload: 'ltr' });
    window.location.reload();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.toast('Completa todos los campos requeridos', 'warning');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.loginForm.disable();

    const { email, password } = this.loginForm.value;

    this.loginSrv.login({ correo: email, contraseña: password }).subscribe({
      next: (resp) => {
        this.loginSrv.guardarSesion(resp.rol, resp.token);
        this.toast('Inicio de sesión exitoso', 'success');

        // Redirige según el rol
        switch (resp.rol) {
          case 'Admin':
            this.router.navigate(['/dashboard']);
            break;
          case 'Docente':
            this.router.navigate(['/evaluaciones/new-evaluacion']);
            break;
          case 'Alumno':
            this.router.navigate(['/alumno/lista-evaluaciones']);
            break;
          
        }

        this.isSubmitting = false;
        this.loginForm.enable();
      },
      error: (err) => {
        console.error(err);
        this.toast('Credenciales inválidas', 'error');
        this.isSubmitting = false;
        this.loginForm.enable();
      },
    });
  }

  private toast(msg: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
    const t = Swal.mixin({
      toast: true, position: 'top-end', showConfirmButton: false,
      timer: 3000, timerProgressBar: true,
      customClass: { popup: 'colored-toast' },
      didOpen: toastEl => {
        toastEl.addEventListener('mouseenter', Swal.stopTimer);
        toastEl.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
    t.fire({ icon, title: msg });
  }
}
