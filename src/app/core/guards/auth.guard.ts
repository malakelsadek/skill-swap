import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from '../services/auth.service';

/** Must be logged in; otherwise go to /login and come back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return (
    inject(AuthService).isLoggedIn() ||
    router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
  );
};

/** Must be logged in with one of the given roles; otherwise /forbidden. */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  (route, state) => {
    const auth = inject(AuthService);
    if (!auth.isLoggedIn()) return authGuard(route, state);
    return auth.hasRole(...roles) || inject(Router).createUrlTree(['/forbidden']);
  };
