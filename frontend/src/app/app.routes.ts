import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { ResultadosComponent } from './components/dashboard/resultados/resultados.component';
import { CuestionariosComponent } from './components/dashboard/cuestionarios/cuestionarios.component';
import { AjustesComponent } from './components/dashboard/ajustes/ajustes.component';
import { ContestarComponent } from './components/dashboard/cuestionarios/contestar/contestar.component';
import { DetalleUsuarioComponent } from './components/dashboard/detalle-usuario/detalle-usuario.component';
import { DatosGeneralesComponent } from './components/dashboard/datos-generales/datos-generales.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'resultados', pathMatch: 'full' },
      { path: 'resultados', component: ResultadosComponent },
      { path: 'detalle-usuario/:id', component: DetalleUsuarioComponent },
      { path: 'datos-generales', component: DatosGeneralesComponent },
      { path: 'cuestionarios', component: CuestionariosComponent },
      { path: 'cuestionarios/contestar', component: ContestarComponent },
      { path: 'ajustes', component: AjustesComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
