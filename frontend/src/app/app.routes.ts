import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { ResultadosComponent } from './components/dashboard/resultados/resultados.component';
import { CuestionariosComponent } from './components/dashboard/cuestionarios/cuestionarios.component';
import { AjustesComponent } from './components/dashboard/ajustes/ajustes.component';
import { ContestarComponent } from './components/dashboard/cuestionarios/contestar/contestar.component';
import { DetalleUsuarioComponent } from './components/dashboard/detalle-usuario/detalle-usuario.component';
import { DatosGeneralesComponent } from './components/dashboard/datos-generales/datos-generales.component';
import { UsuariosComponent } from './components/dashboard/usuarios/usuarios.component';
import { authGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { UserRoleGuard } from './guards/user-role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'datos-generales', pathMatch: 'full' },
      { path: 'resultados', component: ResultadosComponent, canActivate: [UserRoleGuard] },
      { path: 'detalle-usuario/:id', component: DetalleUsuarioComponent, canActivate: [RoleGuard] },
      { path: 'datos-generales', component: DatosGeneralesComponent, canActivate: [RoleGuard] },
      { path: 'cuestionarios', component: CuestionariosComponent },
      { path: 'cuestionarios/contestar', component: ContestarComponent },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [RoleGuard] },
      { path: 'ajustes', component: AjustesComponent, canActivate: [RoleGuard] }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
