import { Component, OnInit } from '@angular/core';
import { DashboardService } from 'src/app/service/dashboard.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexDataLabels,
  ApexGrid,
  ApexTooltip,
} from 'ng-apexcharts';

@Component({
  selector: 'app-reporte-alumno',
  templateUrl: './reporte-alumno.component.html',
  standalone: false,
})
export class ReporteAlumnoComponent implements OnInit {
  alumnoId = 3;
  materia = '';
  fechaInicio = '2025-10-07';

  cargando = false;
  errorMsg: string | null = null;

  alumno: any = null;
  evaluaciones: any[] = [];
  estadisticas: any = null;

  // 📊 Chart config
  rendimientoMaterias: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    tooltip: ApexTooltip;
  } = {
    series: [],
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    xaxis: { categories: [], labels: { style: { colors: '#e5e7eb' } } },
    yaxis: { min: 0, max: 20, labels: { style: { colors: '#e5e7eb' } } },
    stroke: { width: 2 },
    dataLabels: { enabled: false },
    grid: { borderColor: '#374151' },
    tooltip: { theme: 'dark' },
  };

  constructor(private dashboardSrv: DashboardService) {}

  ngOnInit(): void {
    this.cargarReporteAlumno();
  }

  cargarReporteAlumno(): void {
    this.cargando = true;
    this.dashboardSrv
      .obtenerRendimientoPorAlumno(this.alumnoId, this.materia, this.fechaInicio)
      .subscribe({
        next: (resp) => {
          this.alumno = resp.alumno;
          this.evaluaciones = resp.data || [];
          this.estadisticas = resp.estadisticas || null;
          this.configurarGrafico();
        },
        error: (err) => {
          console.error('❌ Error al obtener rendimiento del alumno:', err);
          this.errorMsg = 'No se pudo obtener el rendimiento del alumno.';
        },
        complete: () => (this.cargando = false),
      });
  }

  configurarGrafico(): void {
    // Promedios por materia
    const materias = this.evaluaciones.reduce((acc: any, e) => {
      acc[e.materia] = acc[e.materia] || [];
      acc[e.materia].push(e.calificacion);
      return acc;
    }, {});

    const categorias = Object.keys(materias);
    const promedios = categorias.map(
      (m) => materias[m].reduce((a: number, b: number) => a + b, 0) / materias[m].length
    );

    this.rendimientoMaterias.series = [{ name: 'Promedio', data: promedios }];
    this.rendimientoMaterias.xaxis = { categories: categorias };
  }

  colorPorCalificacion(valor: number): string {
    if (valor >= 17) return 'text-emerald-400';
    if (valor >= 13) return 'text-yellow-400';
    return 'text-red-400';
  }
}
