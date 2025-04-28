import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    let isAdmin = false;
    let currentUserId: number | undefined;
    
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      isAdmin = user?.rol === 'admin';
      currentUserId = user?.id;
    });
    
    // Si es admin, permitir acceso a todas las rutas protegidas
    if (isAdmin) {
      return true;
    }
    
    // Si es usuario regular, solo permitir acceso a su propio detalle
    const requestedUserId = route.paramMap.get('id');
    if (requestedUserId && currentUserId && Number(requestedUserId) === currentUserId) {
      return true;
    }
    
    // Redirigir a resultados si no tiene permisos
    this.router.navigate(['/dashboard/resultados']);
    return false;
  }
} 