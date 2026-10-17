import { Routes } from '@angular/router';
import { Catalogo } from './catalogo/catalogo';
import { soloEmpleados } from './auth.guard';

export const routes: Routes = [
  { path: '', component: Catalogo, title: 'Catálogo de insumos agrícolas' },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login').then(m => m.Login),
    title: 'Acceso de empleados'
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/panel/panel').then(m => m.Panel),
    canActivate: [soloEmpleados],
    title: 'Panel de empleados'
  },
  { path: '**', redirectTo: '' }
];
