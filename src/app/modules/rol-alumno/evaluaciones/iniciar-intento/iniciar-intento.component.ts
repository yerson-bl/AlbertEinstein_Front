import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { EvaluacionService, RespuestaIntento } from 'src/app/service/evaluacion.service';
import Swal from 'sweetalert2';

type TipoPregunta = 'OM' | 'VF' | string;

interface PreguntaItem {
  pregunta_id: string;
  enunciado: string;
  tipo: TipoPregunta;
  opciones?: string[];
}

interface EvaluacionItem {
  _id: string;               // id interno (mongodb)
  evaluacion_id: string;     // id público (uuid) usado por la API
  titulo: string;
  materia: string;
  docente_id: string;
  fecha_entrega: string;
  preguntas: PreguntaItem[];
}

@Component({
  selector: 'app-iniciar-intento',
  templateUrl: './iniciar-intento.component.html',
})
export class IniciarIntentoComponent implements OnInit, OnDestroy {
  intentoId!: string;       // viene del POST /intentos
  evaluacionId!: string;    // evaluacion_id (uuid) asociado a ese intento
  evaluacion!: EvaluacionItem;

  cargando = false;
  enviando = false;
  errorMsg: string | null = null;
  okMsg: string | null = null;

  // { [pregunta_id]: valor marcado }
  seleccion: Record<string, string | number> = {};
  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private evalSrv: EvaluacionService
  ) { }

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const st: any = (nav?.extras?.state ?? history.state) || {};

    // IDs desde el state (robusto a varias formas)
    this.intentoId =
      st?.intento?.intento_id ??
      st?.intentoId ??
      null;

    this.evaluacionId =
      st?.intento?.evaluacion_id ??
      st?.evaluacion_id ??
      st?.evaluacionId ??
      st?.evaluacion?.evaluacion_id ??
      st?.evaluacion?._id ?? // fallback (si solo mandaran _id)
      null;

    // Si traen la evaluación desde la lista, úsala directo
    this.evaluacion = st?.evaluacion ?? null;

    if (!this.intentoId) {
      this.errorMsg = 'No se pudo iniciar el intento. Regresa y vuelve a intentarlo.';
      return;
    }

    // Si ya tenemos la evaluación con sus preguntas, inicializa selección
    if (this.evaluacion?.preguntas?.length) {
      this.evaluacion.preguntas.forEach(p => (this.seleccion[p.pregunta_id] = ''));
      return;
    }

    // Si no viene la evaluación, obtenerla por evaluacionId (uuid)
    if (this.evaluacionId) {
      this.cargando = true;
      const s = this.evalSrv
        .getEvaluacionById(this.evaluacionId)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (resp) => {
            this.evaluacion = resp;
            (this.evaluacion.preguntas || []).forEach(
              p => (this.seleccion[p.pregunta_id] = '')
            );
          },
          error: () => {
            this.errorMsg = 'No se pudo cargar la evaluación.';
          },
        });
      this.subs.push(s);
    } else {
      this.errorMsg = 'No se encontró información de la evaluación.';
    }
  }

  // Helpers UI
  fmtFecha(str: string) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  marcar(p: PreguntaItem, valor: string | number) {
    this.seleccion[p.pregunta_id] = valor;
  }

  respondidas(): number {
    return Object.values(this.seleccion).filter(v => v !== '' && v !== null && v !== undefined).length;
  }

  puedeEnviar(): boolean {
    return !!this.intentoId && this.respondidas() > 0 && !this.enviando;
  }

  enviar(): void {
    if (!this.puedeEnviar()) return;

    this.enviando = true;
    this.errorMsg = null;
    this.okMsg = null;

    const respuestas: RespuestaIntento[] = Object.entries(this.seleccion)
      .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      .map(([pregunta_id, opcion_marcada]) => ({ pregunta_id, opcion_marcada }));

    // Enviamos también evaluacion_id por si el backend lo requiere
    const body = { respuestas, evaluacion_id: this.evaluacionId };

    const s = this.evalSrv
      .finalizarIntento(this.intentoId, body)   // <-- intento_id correcto en la URL
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: (resp) => this.mostrarResultado(resp),
        error: (err) => {
          console.error('Error al finalizar intento:', err);
          this.errorMsg = 'No se pudo finalizar el intento. Intenta nuevamente.';
        },
      });

    this.subs.push(s);
  }

  mostrarResultado(resp: any) {
    const nota = resp?.calificacion ?? 0;
    const feedback = resp?.feedback_alumno ?? '';
    const msg = resp?.msg ?? 'Intento finalizado exitosamente';

    // Desactivar loading antes del Swal
    this.enviando = false;

    Swal.fire({
      title:
        '<h2 style="color:#4f46e5; font-weight:700; margin-bottom:10px;">🎓 Evaluación finalizada</h2>',
      html: `
      <div style="text-align:left; font-size:15px; color:#444; line-height:1.6;">
        <p style="font-size:16px; color:#111; font-weight:600;">
          ✅ Intento finalizado y corregido con IA exitosamente
        </p>
        <p style="margin-top:8px;">
          <b>Tu calificación:</b> 
          <span style="font-size:18px; color:#4f46e5; font-weight:700;">${nota}/20</span>
        </p>
        <div style="background:#f9fafb; border-radius:10px; padding:15px; margin-top:12px;">
          <p style="margin:0; font-weight:600; color:#111;">🗒️ Comentarios de la evaluacion:</p>
          <p style="margin-top:6px; color:#333;">${feedback}</p>
        </div>
        <p style="margin-top:15px; color:#666; font-size:14px;">
          ¡Gracias por tu esfuerzo! Recuerda seguir practicando para seguir mejorando 💪
        </p>
      </div>
    `,
      background: '#fff',
      icon: 'success',
      iconColor: '#4f46e5',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4f46e5',
      width: 500,
      showClass: {
        popup: 'animate__animated animate__fadeInDown',
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp',
      },
    }).then(() => {
      // Redirección elegante al nuevo componente
      this.router.navigate(['/alumno/lista-evaluaciones']);
    });
  }


  cancelar(): void {
    this.router.navigate(['/mis-evaluaciones']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
