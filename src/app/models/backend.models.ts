// src/app/models/backend.models.ts
export interface UsuarioCreate {
  usuario_id: string;
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
  rol: 'Alumno' | 'Docente' | 'Administrador' | string;
  grado?: string | number;   // opcional si no es Alumno
  seccion?: string;          // opcional si no es Alumno
}

export interface EvaluacionCreate {
  titulo: string;
  materia: string;
  grado: string | number;
  seccion: string;
  docente_id: string;
  fecha_entrega: string | null; // 👈 permitir null
  intentos_permitidos: number;
  preguntas: {
    tipo: 'OM' | 'VF';
    enunciado: string;
    opciones: string[];
    respuesta_correcta: string;
  }[];
}

export interface IntentoCreate {
  evaluacion_id: string;
  alumno_id: string;
}

export interface FinalizarIntentoBody {
  respuestas: {
    pregunta_id: string;
    opcion_marcada: string;
  }[];
}
