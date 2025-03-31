import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  isSidebarCollapsed = false;
  private selectTabListener: any;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    
    // Escuchar el evento personalizado para cambiar de tab
    this.selectTabListener = (event: CustomEvent) => {
      if (event.detail && event.detail.tab) {
        this.navigateTo(event.detail.tab);
      }
    };
    
    document.addEventListener('selectTab', this.selectTabListener);
  }
  
  ngOnDestroy(): void {
    // Limpiar el event listener cuando se destruya el componente
    if (this.selectTabListener) {
      document.removeEventListener('selectTab', this.selectTabListener);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate(['/dashboard', route]);
  }
}
