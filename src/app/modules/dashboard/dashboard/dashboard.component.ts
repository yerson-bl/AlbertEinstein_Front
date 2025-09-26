import { Component, OnInit } from '@angular/core';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexStroke, ApexDataLabels,
  ApexFill, ApexTooltip, ApexGrid, ApexResponsive, ApexNonAxisChartSeries, ApexLegend,
  ApexPlotOptions
} from 'ng-apexcharts';

@Component({
  templateUrl: './dashboard.component.html',
  standalone: false,
})
export class DashboardComponent implements OnInit {
  // Filtro
  selectedRange: '7d'|'30d'|'bim'|'ytd' = '30d';

  // KPIs admin
  kpi = {
    students: 1280,    studentsDelta: 4,
    teachers: 86,      teachersDelta: 2,
    activeCourses: 214, coursesDelta: 3,
    attendanceToday: 93, attendanceDelta: 1.2,
    pendingPayments: 18250, pendingDelta: -6,
    incidents: 12, incidentsSolved: 7
  };

  // Sparklines
  spark = {
    chart: <ApexChart>{ type: 'line', height: 40, sparkline: { enabled: true } },
    stroke: <ApexStroke>{ curve: 'smooth', width: 2 },
    fill: <ApexFill>{ opacity: 0.25 },
    students: { series: <ApexAxisChartSeries>[{ name: 'Estudiantes', data: [180,210,240,260,280,300,320] }] },
    teachers: { series: <ApexAxisChartSeries>[{ name: 'Docentes', data: [70,72,74,78,80,83,86] }] },
    courses:  { series: <ApexAxisChartSeries>[{ name: 'Cursos', data: [180,190,195,200,204,210,214] }] },
    att:      { series: <ApexAxisChartSeries>[{ name: 'Asistencia', data: [89,91,88,92,93,94,93] }] },
    pay:      { series: <ApexAxisChartSeries>[{ name: 'Pagos', data: [30,28,24,26,22,20,18] }] },
    inc:      { series: <ApexAxisChartSeries>[{ name: 'Incidencias', data: [9,8,7,10,11,12,12] }] },
  };

  // Asistencia (área)
  attendance: {
    series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis; yaxis: ApexYAxis;
    stroke: ApexStroke; colors: string[]; fill: ApexFill; dataLabels: ApexDataLabels;
    tooltip: ApexTooltip; grid: ApexGrid;
  } = {
    series: [{ name: 'Asistencia (%)', data: [90,92,89,93,94,92,95,94,93,96] }],
    chart: { type: 'area', height: 320, toolbar: { show: false } },
    xaxis: { categories: ['D-9','D-8','D-7','D-6','D-5','D-4','D-3','D-2','D-1','Hoy'], labels: { style: { colors: this.axisColor() } } },
    yaxis: { max: 100, min: 70, labels: { style: { colors: this.axisColor() } } },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#0ea5e9'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0,90,100] } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark' },
    grid: { borderColor: this.gridColor() },
  };
  attendanceAvg = 0;

  // Matrículas por nivel (donut)
  enrollment: {
    series: ApexNonAxisChartSeries; labels: string[]; chart: ApexChart; legend: ApexLegend;
    colors: string[]; responsive: ApexResponsive[];
  } = {
    series: [180, 720, 380], // Inicial, Primaria, Secundaria
    labels: ['Inicial', 'Primaria', 'Secundaria'],
    chart: { type: 'donut', height: 320 },
    legend: { position: 'bottom', labels: { colors: this.axisColor() } },
    colors: ['#22c55e', '#3b82f6', '#a855f7'],
    responsive: [{ breakpoint: 640, options: { chart: { height: 280 } } }],
  };
  enrollmentSummary = [
    { label: 'Inicial', value: 180 },
    { label: 'Primaria', value: 720 },
    { label: 'Secundaria', value: 380 },
  ];

  // Distribución de notas (barras)
  grades: {
    series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis; yaxis: ApexYAxis;
    plotOptions: ApexPlotOptions; dataLabels: ApexDataLabels; colors: string[]; grid: ApexGrid;
  } = {
    series: [{ name: 'Alumnos', data: [12, 48, 160, 260, 180, 40] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: ['0-10','11-12','13-14','15-16','17-18','19-20'], labels: { style: { colors: this.axisColor() } } },
    yaxis: { labels: { style: { colors: this.axisColor() } } },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
    dataLabels: { enabled: false },
    colors: ['#6366f1'],
    grid: { borderColor: this.gridColor() },
  };

  // Pagos (donut)
  payments: {
    series: ApexNonAxisChartSeries; labels: string[]; chart: ApexChart; legend: ApexLegend; colors: string[];
  } = {
    series: [68, 24, 8], // Pagado, Pendiente, Vencido (en %)
    labels: ['Pagado', 'Pendiente', 'Vencido'],
    chart: { type: 'donut', height: 300 },
    legend: { position: 'bottom', labels: { colors: this.axisColor() } },
    colors: ['#10b981', '#f59e0b', '#ef4444'],
  };
  paymentsSummary = [
    { label: 'Pagado', value: 86500 },
    { label: 'Pendiente', value: 18250 },
    { label: 'Vencido', value: 10200 },
  ];

  // Docentes destacados
  topTeachers = [
    { name: 'R. Salazar', course: 'Matemática - 4°', rating: 4.9, avatar: 'assets/images/profile-18.jpeg' },
    { name: 'P. García',  course: 'Comunicación - 5°', rating: 4.8, avatar: 'assets/images/profile-19.jpeg' },
    { name: 'L. Vargas',  course: 'Ciencia - 3°', rating: 4.7, avatar: 'assets/images/profile-20.jpeg' },
    { name: 'M. Rojas',   course: 'Inglés - 2°', rating: 4.6, avatar: 'assets/images/profile-21.jpeg' },
  ];

  // Eventos
  events = [
    { title: 'Consejo de Aula', date: '20 Sep, 10:00', place: 'Sala A-2', type: 'Académico' },
    { title: 'Feria de Ciencias', date: '27 Sep, 09:00', place: 'Patio central', type: 'Comunidad' },
    { title: 'Entrega de Libretas', date: '30 Sep, 16:00', place: 'Dirección', type: 'Académico' },
  ];

  // Incidencias
  incidents = [
    { id: 321, student: 'Soto, Diana (3°B)', type: 'Conducta', date: '14/09', status: 'Abierta' },
    { id: 322, student: 'Ruiz, Matías (1°C)', type: 'Tardanza', date: '14/09', status: 'En proceso' },
    { id: 323, student: 'Pineda, Dana (5°A)', type: 'Conducta', date: '13/09', status: 'Resuelta' },
  ];

  ngOnInit(): void {
    this.attendanceAvg = Math.round(
      (this.attendance.series[0].data as number[]).reduce((a, b) => a + b, 0) /
      (this.attendance.series[0].data as number[]).length
    );
  }

  // Interacciones
  onRangeChange(): void {
    // Simula cambios por rango (ajusta a tu API real)
    if (this.selectedRange === '7d') {
      this.attendance.series = [{ name: 'Asistencia (%)', data: [91,92,90,93,94,92,95] }];
    } else if (this.selectedRange === '30d') {
      this.attendance.series = [{ name: 'Asistencia (%)', data: [90,92,89,93,94,92,95,94,93,96] }];
    } else if (this.selectedRange === 'bim') {
      this.attendance.series = [{ name: 'Asistencia (%)', data: [88,90,92,93,91,94,95,93,94,96] }];
    } else {
      this.attendance.series = [{ name: 'Asistencia (%)', data: [87,89,90,91,92,93,94,94,95,96] }];
    }
    this.attendanceAvg = Math.round(
      (this.attendance.series[0].data as number[]).reduce((a, b) => a + b, 0) /
      (this.attendance.series[0].data as number[]).length
    );
  }

  refresh(): void {
    // Ejemplo simple de “actualización”
    this.kpi.incidents = Math.max(0, this.kpi.incidents - 1);
    this.spark.inc.series = [{ name: 'Incidencias', data: this.shuffle([...this.spark.inc.series[0].data as number[]]) }];
  }

  // UI helpers
  statusPill(status: string): string {
    switch (status) {
      case 'Resuelta':   return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'En proceso': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
      default:           return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'; // Abierta
    }
  }
  private shuffle(arr: number[]): number[] { return arr.sort(() => Math.random() - 0.5); }

  // Colores ejes/grid según modo
  private axisColor(): string | string[] {
    return document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#6b7280';
  }
  private gridColor(): string {
    return document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  }
}
