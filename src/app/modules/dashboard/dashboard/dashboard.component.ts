import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from 'src/app/service/dashboard.service';
import { SeccionService, Grado, Seccion } from 'src/app/service/seccion.service';
import { Subject, takeUntil } from 'rxjs';
import { Materia, MateriaService } from 'src/app/service/materia.service';
import { AlumnoService } from 'src/app/service/alumno.service';

import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexDataLabels,
  ApexFill, ApexTooltip, ApexGrid, ApexPlotOptions
} from 'ng-apexcharts';

interface ResumenDashboard {
  total_alumnos: number;
  total_docentes: number;
  total_evaluaciones: number;
  total_intentos: number;
  total_salones_activos: number;
  [key: string]: number;
}

interface ActividadReciente {
  descripcion?: string;
  description?: string;
  fecha?: string;
  tipo?: string;
  datos?: any;
}

@Component({
  templateUrl: './dashboard.component.html',
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ---- KPIs ----
  resumen: ResumenDashboard = {
    total_alumnos: 0,
    total_docentes: 0,
    total_evaluaciones: 0,
    total_intentos: 0,
    total_salones_activos: 0,
  };

  resumenKeys = [
    { key: 'total_alumnos', label: 'Estudiantes' },
    { key: 'total_docentes', label: 'Docentes' },
    { key: 'total_evaluaciones', label: 'Evaluaciones' },
    { key: 'total_intentos', label: 'Intentos' },
    { key: 'total_salones_activos', label: 'Salones Activos' },
  ];

  // ---- Filtros dinámicos independientes ----
  gradosSalon: Grado[] = [];
  seccionesSalon: Seccion[] = [];

  gradosMateria: Grado[] = [];
  seccionesMateria: Seccion[] = [];

  filtrosSalon = { grado: '', seccion: '', fechaInicio: '2025-09-01', fechaFin: '2025-11-15' };
  filtrosMateria = { grado: '', seccion: '' };

  filtrosComparacion = { alumno_ids: '', materia: 'Matematicas' };
  filtrosTop = { limit: 10, grado: '' };

  // ---- Data de gráficos ----
  rendimientoMaterias: any[] = [];
  topEstudiantes: any[] = [];
  actividades: ActividadReciente[] = [];

  attendance: any = {
    series: [{ name: 'Promedio', data: [] }],
    chart: { type: 'area', height: 320, toolbar: { show: false } },
    xaxis: { categories: [] },
    yaxis: { max: 20, min: 0 },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#0ea5e9'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' },
    grid: { borderColor: '#e5e7eb' },
  };
  attendanceAvg = 0;

  grades: any = {
    series: [{ name: 'Promedio', data: [] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: [] },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
    dataLabels: { enabled: false },
    colors: ['#6366f1'],
    grid: { borderColor: '#e5e7eb' },
  };

  comparacion: any = {
    series: [],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    colors: ['#10b981'],
    grid: { borderColor: '#e5e7eb' },
  };

  materiasActivas: Materia[] = [];
  showMateriaModalComparacion = false;

  // ==== ALUMNOS ====
  alumnosLista: any[] = [];
  alumnosSeleccionados: any[] = [];
  showAlumnosModal = false;



  constructor(
    private dashboardSrv: DashboardService,
    private seccionService: SeccionService,
    private materiaSrv: MateriaService,
    private alumnoSrv: AlumnoService
  ) { }

  ngOnInit(): void {
    this.cargarGradosSalon();
    this.cargarGradosMateria();
    this.cargarResumen();
    this.cargarComparacionAlumnos();
    this.cargarTopEstudiantes();
    this.cargarActividadesRecientes();
    this.cargarMateriasActivas();
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.alumnoSrv.getAllAlumnos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Filtrar activos (rol = Alumno, estado = activo)
          this.alumnosLista = data.filter((a: any) =>
            a.rol === 'Alumno' && a.estado === 'activo'
          );
        },
        error: (err) => console.error('❌ Error cargando alumnos:', err),
      });
  }

  abrirModalAlumnos() {
    this.showAlumnosModal = true;
  }

  cerrarModalAlumnos() {
    this.showAlumnosModal = false;
  }

  toggleSeleccionAlumno(alumno: any) {
    const existe = this.alumnosSeleccionados.find(a => a.usuario_id === alumno.usuario_id);

    if (existe) {
      // quitar
      this.alumnosSeleccionados = this.alumnosSeleccionados.filter(
        a => a.usuario_id !== alumno.usuario_id
      );
    } else {
      // agregar
      this.alumnosSeleccionados.push(alumno);
    }

    // Actualizar el string final "1,2,3"
    this.filtrosComparacion.alumno_ids =
      this.alumnosSeleccionados.map(a => a.usuario_id).join(',');
  }

  // Devuelve lista de nombres seleccionados
get nombresAlumnosSeleccionados(): string {
  return this.alumnosSeleccionados.map(a => a.nombre + ' ' + a.apellido).join(', ');
}

// Verifica si el alumno está seleccionado
estaSeleccionado(a: any): boolean {
  return this.alumnosSeleccionados.some(x => x.usuario_id === a.usuario_id);
}




  cargarMateriasActivas() {
    this.materiaSrv.listarMateria().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.materiasActivas = data.filter(m => m.estado === 'activo');
      },
      error: (err) => console.error('❌ Error cargando materias:', err),
    });
  }
  abrirModalMateriaComparacion() {
    this.showMateriaModalComparacion = true;
  }

  cerrarModalMateriaComparacion() {
    this.showMateriaModalComparacion = false;
  }

  seleccionarMateriaComparacion(nombre: string) {
    this.filtrosComparacion.materia = nombre;
    this.showMateriaModalComparacion = false;
    this.cargarComparacionAlumnos();
  }



  cargarGradosSalon(): void {
    this.seccionService.listarGrados().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.gradosSalon = data;
        if (data.length) {
          this.filtrosSalon.grado = data[0]._id;
          this.cargarSeccionesSalonPorGrado(data[0]._id);
        }
      },
      error: (err) => console.error('Error cargando grados salón:', err),
    });
  }

  cargarGradosMateria(): void {
    this.seccionService.listarGrados().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.gradosMateria = data;
        if (data.length) {
          this.filtrosMateria.grado = data[0]._id;
          this.cargarSeccionesMateriaPorGrado(data[0]._id);
        }
      },
      error: (err) => console.error('Error cargando grados materia:', err),
    });
  }

  // ---------------------
  // 📘 Cargar grados y secciones
  // ---------------------
  // cargarGrados(): void {
  //   this.seccionService
  //     .listarGrados()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (data) => {
  //         this.grados = data;
  //         if (data.length) {
  //           this.filtrosSalon.grado = data[0]._id;
  //           this.filtrosMateria.grado = data[0]._id;
  //           this.cargarSeccionesPorGrado(data[0]._id);
  //         }
  //       },
  //       error: (err) => console.error('Error cargando grados:', err),
  //     });
  // }

  cargarSeccionesSalonPorGrado(gradoId: string): void {
    this.seccionService.seccionPorGrado(gradoId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.seccionesSalon = data;
        if (data.length) {
          this.filtrosSalon.seccion = data[0]._id;
          this.cargarRendimientoSalon();
        }
      },
      error: (err) => console.error('Error cargando secciones salón:', err),
    });
  }

  cargarSeccionesMateriaPorGrado(gradoId: string): void {
    this.seccionService.seccionPorGrado(gradoId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.seccionesMateria = data;
        if (data.length) {
          this.filtrosMateria.seccion = data[0]._id;
          this.cargarRendimientoPorMateria();
        }
      },
      error: (err) => console.error('Error cargando secciones materia:', err),
    });
  }

  // onGradoChange(tipo: 'salon' | 'materia', gradoId: string): void {
  //   this.cargarSeccionesPorGrado(gradoId);
  //   if (tipo === 'salon') this.cargarRendimientoSalon();
  //   else this.cargarRendimientoPorMateria();
  // }

  // ---------------------
  // Endpoints principales
  // ---------------------

  cargarResumen(): void {
    this.dashboardSrv.obtenerEstadisticas().subscribe({
      next: (resp: any) => (this.resumen = resp),
      error: (err: any) => console.error('❌ Error resumen:', err),
    });
  }

  cargarRendimientoSalon(): void {
    const f = this.filtrosSalon;
    const g = this.gradosSalon.find(x => x._id === f.grado)?.nombre || f.grado;
    const s = this.seccionesSalon.find(x => x._id === f.seccion)?.nombre || f.seccion;

    this.dashboardSrv.obtenerRendimientoPorSalon(g, s, f.fechaInicio, f.fechaFin).subscribe({
      next: (resp: any) => {
        const data = resp.data || [];
        this.attendance.series = [{ name: 'Promedio', data: data.map((d: any) => d.promedio) }];
        this.attendance.xaxis = { categories: data.map((d: any) => d.fecha) };
        this.attendanceAvg = data.length
          ? Math.round(data.reduce((a: number, b: any) => a + b.promedio, 0) / data.length)
          : 0;
      },
      error: (err: any) => console.error('❌ Error rendimiento salón:', err),
    });
  }


  cargarRendimientoPorMateria(): void {
    const f = this.filtrosMateria;
    const g = this.gradosMateria.find(x => x._id === f.grado)?.nombre || f.grado;
    const s = this.seccionesMateria.find(x => x._id === f.seccion)?.nombre || f.seccion;

    this.dashboardSrv.obtenerRendimientoPorMateria(g, s).subscribe({
      next: (resp: any) => {
        this.rendimientoMaterias = resp.materias || [];
        this.grades.series = [{ name: 'Promedio', data: this.rendimientoMaterias.map((m: any) => m.promedio) }];
        this.grades.xaxis = { categories: this.rendimientoMaterias.map((m: any) => m.materia) };
      },
      error: (err: any) => console.error('❌ Error rendimiento materias:', err),
    });
  }


  cargarComparacionAlumnos(): void {
    const f = this.filtrosComparacion;
    const alumnoIds = f.alumno_ids.split(',').map((x: string) => x.trim());
    this.dashboardSrv.compararRendimientoAlumnos(alumnoIds, f.materia).subscribe({
      next: (resp: any) => {
        const alumnos = resp.alumnos || [];
        this.comparacion.series = [{ name: 'Promedio', data: alumnos.map((a: any) => a.promedio) }];
        this.comparacion.xaxis = { categories: alumnos.map((a: any) => a.nombre) };
      },
      error: (err: any) => console.error('❌ Error comparación alumnos:', err),
    });
  }

  cargarTopEstudiantes(): void {
    const f = this.filtrosTop;

    let gradoNombre = '';
    if (f.grado) {
      const gradoSel = this.gradosMateria.find(g => g._id === f.grado);
      gradoNombre = gradoSel?.nombre || f.grado;
    }


    this.dashboardSrv.obtenerTopEstudiantes(f.limit, gradoNombre).subscribe({
      next: (resp: any) => (this.topEstudiantes = resp.ranking || []),
      error: (err: any) => console.error('❌ Error top estudiantes:', err),
    });
  }


  cargarActividadesRecientes(): void {
    this.dashboardSrv.actividadesRecientes().subscribe({
      next: (resp: any) => (this.actividades = resp.actividades || []),
      error: (err: any) => console.error('❌ Error actividades recientes:', err),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
