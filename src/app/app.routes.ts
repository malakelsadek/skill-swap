import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'forbidden', loadComponent: () => import('./shared/forbidden/forbidden').then((m) => m.Forbidden) },
];
