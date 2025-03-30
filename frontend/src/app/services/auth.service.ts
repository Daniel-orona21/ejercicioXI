import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

interface AuthResponse {
  user: {
    id: number;
    nombre: string;
    email: string;
  };
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);
          }
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }
}
