import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { ResultadosComponent } from './components/dashboard/resultados/resultados.component';
import { CuestionariosComponent } from './components/dashboard/cuestionarios/cuestionarios.component';
import { AjustesComponent } from './components/dashboard/ajustes/ajustes.component';
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
      { path: 'cuestionarios', component: CuestionariosComponent },
      { path: 'ajustes', component: AjustesComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
