import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isRegistering = false;
  showLoginPassword = false;
  showRegisterPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Inicio de sesión exitoso!',
            text: 'Bienvenido de vuelta'
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error.message || 'Error al iniciar sesión'
          });
        }
      });
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Tu cuenta ha sido creada correctamente'
          }).then(() => {
            // Pre-llenar el formulario de login con los datos del registro
            this.loginForm.patchValue({
              email: this.registerForm.value.email,
              password: this.registerForm.value.password
            });
            // Limpiar el formulario de registro
            this.registerForm.reset();
            // Cambiar a la carta de login
            this.isRegistering = false;
            // Resetear la visibilidad de las contraseñas
            this.showLoginPassword = false;
            this.showRegisterPassword = false;
          });
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error en el registro',
            text: error.error.message || 'Error al crear la cuenta'
          });
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleForm(): void {
    if (!this.isRegistering) {
      // Si vamos a cambiar a registro, limpiamos el formulario de registro
      this.registerForm.reset();
    } else {
      // Si vamos a cambiar a login, limpiamos el formulario de login
      this.loginForm.reset();
    }
    this.isRegistering = !this.isRegistering;
    // Resetear la visibilidad de las contraseñas
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
  }

  getLoginEmailError(): string {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) {
      return 'Email is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  getLoginPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  getRegisterNameError(): string {
    const control = this.registerForm.get('nombre');
    if (control?.hasError('required')) {
      return 'El nombre es requerido';
    }
    if (control?.hasError('minlength')) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    return '';
  }

  getRegisterEmailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return 'Email is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  getRegisterPasswordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }
}
