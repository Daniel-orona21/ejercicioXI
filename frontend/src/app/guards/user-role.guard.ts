import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserRoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let userId: number | undefined;
    let isRegularUser = false;

    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      isRegularUser = user?.rol === 'usuario';
      userId = user?.id;
    });

    const detalleUsuarioPath = `/dashboard/detalle-usuario/${userId}`;
    if (isRegularUser && userId && state.url !== detalleUsuarioPath) {
      this.router.navigate([detalleUsuarioPath]);
      return false;
    }
    // Si ya está en su propio detalle, permite la navegación
    return true;
  }
} 