import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpBackend, HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

//Routes
import { routes } from './app.route';

import { AppComponent } from './app.component';

// store
import { StoreModule } from '@ngrx/store';
import { indexReducer } from './store/index.reducer';

// shared module
import { SharedModule } from 'src/shared.module';

// i18n
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// AOT compilation support
export function HttpLoaderFactory(httpHandler: HttpBackend): TranslateHttpLoader {
    return new TranslateHttpLoader(new HttpClient(httpHandler));
}

// dashboard
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

// pages
import { KnowledgeBaseComponent } from './pages/knowledge-base';
import { FaqComponent } from './pages/faq';

// Layouts
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';

import { HeaderComponent } from './layouts/header';
import { FooterComponent } from './layouts/footer';
import { SidebarComponent } from './layouts/sidebar';
import { ThemeCustomizerComponent } from './layouts/theme-customizer';
import { DashboardComponent } from './modules/dashboard/dashboard/dashboard.component';
import { List, LucideAngularModule } from 'lucide-angular';
import { icons } from 'lucide-angular';

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
import { ListaEvaluacionesComponent } from './modules/rol-alumno/evaluaciones/lista-evaluaciones/lista-evaluaciones.component';
import { IniciarIntentoComponent } from './modules/rol-alumno/evaluaciones/iniciar-intento/iniciar-intento.component';
import { ListSeccionComponent } from './modules/secciones/list-seccion/list-seccion.component';
import { NewSeccionComponent } from './modules/secciones/new-seccion/new-seccion.component';

@NgModule({
    imports: [

        LucideAngularModule.pick(icons),
        RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpBackend],
            },
        }),
        StoreModule.forRoot({ index: indexReducer }),
        SharedModule.forRoot(),
    ],
    declarations: [
        AppComponent,
        HeaderComponent,
        FooterComponent,
        SidebarComponent,
        ThemeCustomizerComponent,
        TablesComponent,
        FontIconsComponent,
        ChartsComponent,
        IndexComponent,
        AnalyticsComponent,
        FinanceComponent,
        CryptoComponent,
        WidgetsComponent,
        DragndropComponent,
        AppLayout,
        AuthLayout,
        KnowledgeBaseComponent,
        FaqComponent,


        DashboardComponent,
        ListUsuarioComponent,
        NewUsuarioComponent,
        ListEvaluacionComponent,
        NewEvaluacionComponent,
        ListAlumnosComponent,
        NewAlumnoComponent,
        ListDocentesComponent,
        NewDocenteComponent,
        ListAdminComponent,
        NewAdminComponent,

        ListaEvaluacionesComponent,
        IniciarIntentoComponent,

        ListSeccionComponent,
        NewSeccionComponent


    ],

    providers: [Title],
    bootstrap: [AppComponent],
})
export class AppModule { }
