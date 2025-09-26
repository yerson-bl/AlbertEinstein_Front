// src/app/pages/usuarios/new-usuario/new-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from 'src/app/service/usuario.service';
import { UsuarioCreate } from 'src/app/models/backend.models';

type RolUsuario = 'Alumno' | 'Docente' | 'Administrador';

@Component({
  selector: 'app-new-usuario',
  templateUrl: './new-usuario.component.html',
  styleUrls: ['./new-usuario.component.css'],
  standalone: false,
})
export class NewUsuarioComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;

  roles: RolUsuario[] = ['Alumno', 'Docente', 'Administrador'];
  grados: (number | string)[] = [1, 2, 3, 4, 5, 6];
  secciones: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      usuario_id: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      // Nota: el API espera "contraseña". Internamente usamos "contrasena" y lo mapeamos al enviar.
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['Alumno', Validators.required],
      grado: [''],
      seccion: [''],
    });

    // Reglas condicionales para Alumno
    this.form.get('rol')?.valueChanges.subscribe((rol: RolUsuario) => {
      this.updateAlumnoValidators(rol);
    });

    // Inicializa validadores para Alumno (valor por defecto)
    this.updateAlumnoValidators(this.form.get('rol')?.value as RolUsuario);
  }

  private updateAlumnoValidators(rol: RolUsuario) {
    const gradoCtrl = this.form.get('grado');
    const seccionCtrl = this.form.get('seccion');

    if (rol === 'Alumno') {
      gradoCtrl?.setValidators([Validators.required]);
      seccionCtrl?.setValidators([Validators.required]);
    } else {
      gradoCtrl?.clearValidators();
      seccionCtrl?.clearValidators();
      gradoCtrl?.setValue('');
      seccionCtrl?.setValue('');
    }
    gradoCtrl?.updateValueAndValidity({ emitEvent: false });
    seccionCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showMessage('Revisa los campos obligatorios', 'warning');
      return;
    }

    this.isLoading = true;

    const raw = this.form.value;

    // 👇 Usa undefined cuando NO es Alumno (no null)
    const payload: UsuarioCreate = {
      usuario_id: raw.usuario_id,
      nombre: raw.nombre,
      apellido: raw.apellido,
      correo: raw.correo,
      contraseña: raw.contrasena,
      rol: raw.rol,
      grado: raw.rol === 'Alumno' ? String(raw.grado) : undefined,
      seccion: raw.rol === 'Alumno' ? raw.seccion : undefined,
    };

    this.usuarioService.crearUsuario(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.showMessage(res?.msg || 'Usuario creado exitosamente', 'success');
        this.form.reset({
          usuario_id: '',
          nombre: '',
          apellido: '',
          correo: '',
          contrasena: '',
          rol: 'Alumno',
          grado: '',
          seccion: '',
        });
      },
      error: () => {
        this.isLoading = false;
        this.showMessage('Error al crear usuario', 'error');
      },
    });
  }

  // Helpers UI
  get isAlumno(): boolean {
    return this.form.get('rol')?.value === 'Alumno';
  }

  // Mensajes básicos (puedes migrar a SweetAlert cuando quieras)
  showMessage(msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    alert(msg);
  }
}
