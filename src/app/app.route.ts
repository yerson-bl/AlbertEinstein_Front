import { Routes } from '@angular/router';

// dashboard
import { DashboardComponent } from './modules/dashboard/dashboard/dashboard.component';

import { IndexComponent } from './index';
import { AnalyticsComponent } from './analytics';
import { FinanceComponent } from './finance';
import { CryptoComponent } from './crypto';

// widgets
import { WidgetsComponent } from './widgets';

// tables
import { TablesComponent } from './tables';

// font-icons
import { FontIconsComponent } from './font-icons';

// charts
import { ChartsComponent } from './charts';

// dragndrop
import { DragndropComponent } from './dragndrop';

// layouts
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';

// pages
import { KnowledgeBaseComponent } from './pages/knowledge-base';
import { FaqComponent } from './pages/faq';
import { ListUsuarioComponent } from './modules/usuarios/list-usuario/list-usuario.component';
import { NewUsuarioComponent } from './modules/usuarios/new-usuario/new-usuario.component';
import { ListEvaluacionComponent } from './modules/evaluaciones/list-evaluacion/list-evaluacion.component';
import { NewEvaluacionComponent } from './modules/evaluaciones/new-evaluacion/new-evaluacion.component';
import { ListAlumnosComponent } from './modules/alumnos/list-alumnos/list-alumnos.component';
import { NewAlumnoComponent } from './modules/alumnos/new-alumno/new-alumno.component';
import { ListDocentesComponent } from './modules/docentes/list-docentes/list-docentes.component';
import { NewDocenteComponent } from './modules/docentes/new-docente/new-docente.component';
import { ListAdminComponent } from './modules/admin/list-admin/list-admin.component';
import { NewAdminComponent } from './modules/admin/new-admin/new-admin.component';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
    },
    {
        path: '',
        component: AppLayout,
        // canActivateChild: [AuthGuard],
        children: [
            // dashboard
            { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard Web | Albert Einstein' } },
            //usuarios
            { path: 'usuarios/list-usuario', component: ListUsuarioComponent, data: { title: 'Lista de Usuarios | Albert Einstein' } },
            { path: 'usuarios/new-usuario', component: NewUsuarioComponent, data: { title: 'Nuevo Usuario | Albert Einstein' } },
            //evaluaciones
            { path: 'evaluaciones/list-evaluacion', component: ListEvaluacionComponent, data: { title: 'Lista de Evaluaciones | Albert Einstein' } },
            { path: 'evaluaciones/new-evaluacion', component: NewEvaluacionComponent, data: { title: 'Nuevo Evaluación | Albert Einstein' } },

            //alumnos
            { path: 'alumnos/list-alumno', component: ListAlumnosComponent, data: { title: 'Lista de Alumnos | Albert Einstein' } },
            { path: 'alumnos/new-alumno', component: NewAlumnoComponent, data: { title: 'Nuevo Alumno | Albert Einstein' } },

            //docentes
            { path: 'docentes/list-docentes', component: ListDocentesComponent, data: { title: 'Lista de Docentes | Albert Einstein' } },
            { path: 'docentes/new-docente', component: NewDocenteComponent, data: { title: 'Nuevo Docente | Albert Einstein' } },

            //admin
            { path: 'admin/list-admin', component: ListAdminComponent, data: { title: 'Lista de Admins | Albert Einstein' } },
            { path: 'admin/new-admin', component: NewAdminComponent, data: { title: 'Nuevo Admin | Albert Einstein' } },


            // dashboard
            { path: '', component: IndexComponent, data: { title: 'Sales Admin' } },
            { path: 'analytics', component: AnalyticsComponent, data: { title: 'Analytics Admin' } },
            { path: 'finance', component: FinanceComponent, data: { title: 'Finance Admin' } },
            { path: 'crypto', component: CryptoComponent, data: { title: 'Crypto Admin' } },

            // widgets
            { path: 'widgets', component: WidgetsComponent, data: { title: 'Widgets' } },

            // font-icons
            { path: 'font-icons', component: FontIconsComponent, data: { title: 'Font Icons' } },

            // charts
            { path: 'charts', component: ChartsComponent, data: { title: 'Charts' } },

            // dragndrop
            { path: 'dragndrop', component: DragndropComponent, data: { title: 'Dragndrop' } },

            // pages
            { path: 'pages/knowledge-base', component: KnowledgeBaseComponent, data: { title: 'Knowledge Base' } },
            { path: 'pages/faq', component: FaqComponent, data: { title: 'FAQ' } },

            //apps
            { path: '', loadChildren: () => import('./apps/apps.module').then((d) => d.AppsModule) },

            // components
            { path: '', loadChildren: () => import('./components/components.module').then((d) => d.ComponentsModule) },

            // elements
            { path: '', loadChildren: () => import('./elements/elements.module').then((d) => d.ElementsModule) },

            // forms
            { path: '', loadChildren: () => import('./forms/form.module').then((d) => d.FormModule) },

            // users
            { path: '', loadChildren: () => import('./users/user.module').then((d) => d.UsersModule) },

            // tables
            { path: 'tables', component: TablesComponent, data: { title: 'Tables' } },
            { path: '', loadChildren: () => import('./datatables/datatables.module').then((d) => d.DatatablesModule) },
        ],
    },

    {
        path: '',
        component: AuthLayout,
        children: [
            // pages
            { path: '', loadChildren: () => import('./pages/pages.module').then((d) => d.PagesModule) },

            // auth
            { path: '', loadChildren: () => import('./auth/auth.module').then((d) => d.AuthModule) },
        ],
    },
];
