import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from './firebase.service';

/** Protege /admin: sin sesión iniciada redirige al login. */
export const soloEmpleados: CanActivateFn = async () => {
  const fb = inject(FirebaseService);
  const router = inject(Router);
  await fb.sesionLista;
  return fb.usuario() ? true : router.createUrlTree(['/admin/login']);
};
