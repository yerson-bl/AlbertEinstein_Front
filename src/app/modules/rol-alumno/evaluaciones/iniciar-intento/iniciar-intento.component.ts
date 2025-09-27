import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { EvaluacionService, RespuestaIntento } from 'src/app/service/evaluacion.service';

type TipoPregunta = 'OM' | 'VF' | string;

interface PreguntaItem {
  pregunta_id: string;
  enunciado: string;
  tipo: TipoPregunta;
  opciones?: string[];            // para OM
  respuesta_correcta?: string;    // viene en el listado (no la usamos aquí)
}

interface EvaluacionItem {
  _id: string;
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
  intentoId!: string;
  evaluacion!: EvaluacionItem;

  cargando = false;
  enviando = false;
  errorMsg: string | null = null;
  okMsg: string | null = null;

  // Respuestas marcadas: { [pregunta_id]: valor }
  seleccion: Record<string, string | number> = {};

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evalSrv: EvaluacionService
  ) { }

  ngOnInit(): void {
    // 👉 Tomamos datos del navigation state (primera carga) o de history.state (refresh)
    const nav = this.router.getCurrentNavigation();
    const st: any = (nav?.extras?.state ?? history.state) || {};

    this.intentoId = st?.intentoId ?? null;   // puede venir nulo
    const intento = st?.intento ?? null;     // por si quieres usarlo
    const evaluacion = st?.evaluacion as EvaluacionItem | undefined;

    if (evaluacion) {
      // Tenemos la evaluación completa (lo normal desde "Iniciar intento")
      this.evaluacion = evaluacion;
      (this.evaluacion.preguntas || []).forEach(p => (this.seleccion[p.pregunta_id] = ''));
      return;
    }

    // Si NO llegó evaluación pero sí un intentoId, intentamos levantar el intento del backend
    if (this.intentoId) {
      this.cargando = true;
      const s = this.evalSrv.getIntentoById(this.intentoId)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (resp) => {
            // adapta según tu API: idealmente resp.evaluacion
            this.evaluacion = resp?.evaluacion as EvaluacionItem;
            if (!this.evaluacion) {
              this.errorMsg = 'No se pudo cargar la evaluación del intento.';
              return;
            }
            (this.evaluacion.preguntas || []).forEach(
              p => (this.seleccion[p.pregunta_id] = '')
            );
          },
          error: () => {
            this.errorMsg = 'No se pudo cargar el intento.';
          }
        });
      this.subs.push(s);
      return;
    }

    // Si no hay ni evaluación ni intentoId en el state, no podemos continuar
    this.errorMsg = 'No se pudo abrir el intento. Regresa y vuelve a iniciar.';
    // Opcional: navegar de vuelta a la lista
    // this.router.navigate(['/alumno/evaluaciones']);
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
    // permite envío con al menos 1 respuesta marcada (ajústalo si quieres obligar todas)
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

    const s = this.evalSrv
      .finalizarIntento(this.intentoId, respuestas)
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: (resp) => {
          this.okMsg = '¡Intento finalizado correctamente!';
          // puedes navegar a un "resumen" si quieres:
          // this.router.navigate(['/mis-evaluaciones']);
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se pudo finalizar el intento. Intenta nuevamente.';
        },
      });

    this.subs.push(s);
  }

  cancelar(): void {
    this.router.navigate(['/mis-evaluaciones']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
