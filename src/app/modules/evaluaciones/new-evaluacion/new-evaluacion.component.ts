import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { EvaluacionService } from 'src/app/service/evaluacion.service';
import { SeccionService, Grado, Seccion } from 'src/app/service/seccion.service';
import Swal from 'sweetalert2';

type TipoPregunta = 'OM' | 'VF';

type PreguntaCreate = {
  tipo: 'OM' | 'VF';
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
};

type EvaluacionCreate = {
  titulo: string;
  materia: string;
  grado: string;
  seccion: string;
  docente_id: string;
  fecha_entrega: string;
  intentos_permitidos: number;
  preguntas: PreguntaCreate[];
};

@Component({
  selector: 'app-new-evaluacion',
  templateUrl: './new-evaluacion.component.html',
})
export class NewEvaluacionComponent implements OnInit, OnDestroy {
  Math = Math;
  form!: FormGroup;
  cargando = false;
  private subs: Subscription[] = [];
  grados: Grado[] = [];
  secciones: Seccion[] = [];

  constructor(
    private fb: FormBuilder,
    private evaluacionSrv: EvaluacionService,
    private seccionSrv: SeccionService // 👈 agregado
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      materia: ['', Validators.required],
      grado: ['', Validators.required],
      seccion: ['', Validators.required],
      docente_id: ['', Validators.required],
      fecha_entrega_local: ['', Validators.required],
      intentos_permitidos: [1, [Validators.required, Validators.min(1)]],
      preguntas: this.fb.array([]),
    });

    // pregunta inicial
    this.agregarPregunta('OM');

    // cargar grados
    this.cargarGrados();

    // cargar secciones según grado
    this.form.get('grado')?.valueChanges.subscribe((gradoId) => {
      if (gradoId) this.cargarSeccionesPorGrado(gradoId);
      else this.secciones = [];
    });
  }

  // === Getters visibles desde el template ===
  get f() { return this.form.controls as any; }

  get preguntasFA(): FormArray {
    return this.form.get('preguntas') as FormArray;
  }

  opcionesFA(idxPregunta: number): FormArray {
    return this.preguntasFA.at(idxPregunta).get('opciones') as FormArray;
  }

  // usado en *ngFor="let ...; trackBy: trackByIndex"
  trackByIndex = (i: number) => i;

  // 👇 ESTA función es la que tu template ya usa: pregInval(i,'campo')
  pregInval(i: number, controlName: string): boolean {
    const c = (this.preguntasFA.at(i) as FormGroup).get(controlName);
    return !!(c && c.touched && c.invalid);
  }

  // ==== NUEVOS MÉTODOS ====

  cargarGrados(): void {
    this.seccionSrv.listarGrados().subscribe({
      next: (data) => {
        this.grados = data.filter((g) => g.estado);
      },
      error: () => this.toast('Error al cargar los grados', 'error'),
    });
  }

  cargarSeccionesPorGrado(gradoId: string): void {
    this.seccionSrv.seccionPorGrado(gradoId).subscribe({
      next: (data) => {
        this.secciones = data.filter((s) => s.estado);
      },
      error: () => this.toast('Error al cargar las secciones', 'error'),
    });
  }


  // ---- builders ----
  private buildOpcion(valor = ''): FormGroup {
    return this.fb.group({
      valor: [valor, Validators.required],
    });
  }

  private buildPregunta(tipo: TipoPregunta): FormGroup {
    const fg = this.fb.group({
      tipo: this.fb.control<TipoPregunta>(tipo, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      enunciado: ['', Validators.required],
      opciones: this.fb.array([]),
      respuesta_correcta: this.fb.control<string | null>(null, {
        validators: [Validators.required],
      }),
    });

    if (tipo === 'OM') {
      const opts = fg.get('opciones') as FormArray;
      // mínimo 2 opciones
      opts.push(this.buildOpcion(''));
      opts.push(this.buildOpcion(''));
      this.attachRespuestaSync(fg);
    } else {
      // VF: opciones fijas Verdadero/Falso, no se agregan al array
      // pero igual se valida respuesta_correcta
    }

    return fg;
  }

  // Mantiene respuesta_correcta ∈ opciones (para OM)
  private attachRespuestaSync(preguntaFG: FormGroup) {
    const opcionesFA = preguntaFG.get('opciones') as FormArray;
    const sub = opcionesFA.valueChanges.subscribe(() => {
      const valores = (opcionesFA.value as Array<{ valor: string }>)
        .map(v => v?.valor ?? '')
        .filter(Boolean);

      const rcCtrl = preguntaFG.get('respuesta_correcta') as FormControl;
      if (!valores.includes(rcCtrl.value)) {
        rcCtrl.setValue(null, { emitEvent: false });
        rcCtrl.markAsTouched();
      }
    });
    this.subs.push(sub);
  }

  opcionesValores(i: number): string[] {
    const arr = this.opcionesFA(i).value as Array<{ valor: string }>;
    return (arr || []).map(o => o?.valor ?? '').filter(Boolean);
  }

  // ---- acciones preguntas ----
  agregarPregunta(tipo: TipoPregunta) {
    this.preguntasFA.push(this.buildPregunta(tipo));
  }

  eliminarPregunta(index: number) {
    this.preguntasFA.removeAt(index);
  }

  addOpcion(idxPregunta: number) {
    this.opcionesFA(idxPregunta).push(this.buildOpcion(''));
  }

  removeOpcion(idxPregunta: number, idxOpcion: number) {
    const arr = this.opcionesFA(idxPregunta);
    arr.removeAt(idxOpcion);
    // seguimos garantizando mínimo 2
    while (arr.length < 2) arr.push(this.buildOpcion(''));
  }

  // ---- guardar ----
  guardar() {
    // Validación frontend antes de llamar API
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast('Completa todos los campos requeridos', 'warning');
      return;
    }

    const fechaLocal = this.form.value.fecha_entrega_local as string | null;
    if (!fechaLocal) {
      this.f.fecha_entrega_local.setErrors({ required: true });
      this.form.markAllAsTouched();
      this.toast('La fecha de entrega es obligatoria', 'warning');
      return;
    }

    const payload: EvaluacionCreate = this.toApiPayload();
    this.cargando = true;

    this.evaluacionSrv.crearEvaluacion(payload)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (resp) => {
          console.log('Evaluación creada', resp);

          // ✅ TOAST EXITO (arriba derecha, igual login)
          this.toast('Evaluación creada correctamente', 'success');

          // limpiar form luego de crear
          this.form.reset();
          this.form.patchValue({ intentos_permitidos: 1 });
          this.preguntasFA.clear();
        },
        error: (err) => {
          console.error('Error creando evaluación', err);

          // ❌ TOAST ERROR
          this.toast('Error al crear la evaluación', 'error');
        },
      });
  }

  private toApiPayload(): EvaluacionCreate {
    const v = this.form.value;

    // convertir fecha local a ISO string
    const d = new Date(String(v.fecha_entrega_local));

    const preguntas = (v.preguntas as any[]).map((p) => {
      if (p.tipo === 'VF') {
        return {
          tipo: 'VF' as const,
          enunciado: String(p.enunciado ?? ''),
          opciones: ['Verdadero', 'Falso'],
          respuesta_correcta: String(p.respuesta_correcta ?? ''),
        };
      }

      const opciones = (p.opciones || [])
        .map((o: any) => String(o?.valor ?? ''))
        .filter((x: string) => x);

      return {
        tipo: 'OM' as const,
        enunciado: String(p.enunciado ?? ''),
        opciones,
        respuesta_correcta: String(p.respuesta_correcta ?? ''),
      };
    }) as EvaluacionCreate['preguntas'];

    return {
      titulo: String(v.titulo),
      materia: String(v.materia),
      grado: this.obtenerNombreGrado(v.grado),
      seccion: this.obtenerNombreSeccion(v.seccion),
      docente_id: String(v.docente_id),
      fecha_entrega: d.toISOString(),
      intentos_permitidos: Number(v.intentos_permitidos) || 1,
      preguntas,
    };
  }

  private obtenerNombreGrado(id: string): string {
    const g = this.grados.find((x) => x._id === id);
    return g ? g.nombre : id; // si no encuentra, deja el id (fallback)
  }

  private obtenerNombreSeccion(id: string): string {
    const s = this.secciones.find((x) => x._id === id);
    return s ? s.nombre : id;
  }


  // === Toast idéntico al del login ===
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
    this.subs.forEach(s => s.unsubscribe());
  }
}
