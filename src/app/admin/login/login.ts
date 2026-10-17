import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../firebase.service';
import { NEGOCIO } from '../../firebase.config';

const MENSAJES: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Consulte con el administrador.',
  'auth/too-many-requests': 'Demasiados intentos. Espere unos minutos e inténtelo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revise su internet.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está activado en Firebase Authentication.'
};

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly fb = inject(FirebaseService);
  private readonly router = inject(Router);

  readonly negocio = NEGOCIO;
  email = '';
  clave = '';
  readonly error = signal('');
  readonly cargando = signal(false);

  constructor() {
    // Si ya hay una sesión abierta, entra directo al panel.
    this.fb.sesionLista.then(() => { if (this.fb.usuario()) this.router.navigate(['/admin']); });
  }

  async entrar(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    if (!this.email.trim() || !this.clave) return this.error.set('Escriba su correo y contraseña.');
    this.cargando.set(true);
    try {
      await this.fb.login(this.email.trim(), this.clave);
      this.clave = '';
      await this.router.navigate(['/admin']);
    } catch (ex) {
      const codigo = (ex as { code?: string }).code ?? '';
      this.error.set(MENSAJES[codigo] ?? 'No se pudo iniciar sesión.');
    } finally {
      this.cargando.set(false);
    }
  }
}
