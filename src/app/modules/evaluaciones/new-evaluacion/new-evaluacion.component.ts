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



type TipoPregunta = 'OM' | 'VF';
type PreguntaCreate = {
  tipo: 'OM' | 'VF';              // 👈 sin string adicional
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
};

type EvaluacionCreate = {
  titulo: string;
  materia: string;
  grado: string;                  // si en tu backend es string|number, igual sirve
  seccion: string;
  docente_id: string;
  fecha_entrega: string;          // ISO
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

  constructor(
    private fb: FormBuilder,
    private evaluacionSrv: EvaluacionService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      materia: ['', Validators.required],
      grado: ['', Validators.required],          // string según service
      seccion: ['', Validators.required],
      docente_id: ['', Validators.required],
      fecha_entrega_local: ['', Validators.required], // se convierte a ISO al guardar
      intentos_permitidos: [1, [Validators.required, Validators.min(1)]],
      preguntas: this.fb.array([]),
    });

    // 1 pregunta inicial (opcional)
    this.agregarPregunta('OM');
  }

  // Atajos
  get f() { return this.form.controls as any; }
  get preguntasFA(): FormArray { return this.form.get('preguntas') as FormArray; }

  opcionesFA(idxPregunta: number): FormArray {
    return this.preguntasFA.at(idxPregunta).get('opciones') as FormArray;
  }

  // UI helpers
  trackByIndex = (i: number) => i;

  pregInval(i: number, controlName: string): boolean {
    const c = (this.preguntasFA.at(i) as FormGroup).get(controlName);
    return !!(c && c.touched && c.invalid);
  }

  // ---- builders ----
  private buildOpcion(valor = ''): FormGroup {
    return this.fb.group({ valor: [valor, Validators.required] });
  }

  private buildPregunta(tipo: TipoPregunta): FormGroup {
    const fg = this.fb.group({
      tipo: this.fb.control<TipoPregunta>(tipo, { nonNullable: true, validators: [Validators.required] }),
      enunciado: ['', Validators.required],
      opciones: this.fb.array([]),
      respuesta_correcta: this.fb.control<string | null>(null, { validators: [Validators.required] }),
    });

    if (tipo === 'OM') {
      const opts = fg.get('opciones') as FormArray;
      opts.push(this.buildOpcion(''));
      opts.push(this.buildOpcion(''));
      this.attachRespuestaSync(fg);
    } else {
      // VF: opciones fijas, solo elegimos la respuesta
      fg.get('respuesta_correcta')?.setValidators([Validators.required]);
    }

    return fg;
  }

  // Mantiene respuesta_correcta ∈ opciones (OM)
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
    // mínimo 2 opciones
    while (arr.length < 2) arr.push(this.buildOpcion(''));
  }

  // ---- guardar ----
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fechaLocal = this.form.value.fecha_entrega_local as string | null;
    if (!fechaLocal) {
      this.f.fecha_entrega_local.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    const payload: EvaluacionCreate = this.toApiPayload();

    this.cargando = true;
    this.evaluacionSrv.crearEvaluacion(payload)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: (resp) => {
          console.log('Evaluación creada', resp);
          // Reset suave
          this.form.reset();
          this.form.patchValue({ intentos_permitidos: 1 });
          this.preguntasFA.clear();
        },
        error: (err) => {
          console.error('Error creando evaluación', err);
        }
      });
  }

  private toApiPayload(): EvaluacionCreate {
    const v = this.form.value;

    // fecha_entrega: ISO (string)
    const d = new Date(String(v.fecha_entrega_local));
    if (isNaN(d.getTime())) throw new Error('Fecha de entrega inválida');

    // preguntas según contrato del service
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
      grado: String(v.grado),              // ← el service define string
      seccion: String(v.seccion),
      docente_id: String(v.docente_id),
      fecha_entrega: d.toISOString(),      // ← string ISO
      intentos_permitidos: Number(v.intentos_permitidos) || 1,
      preguntas,
    };
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
