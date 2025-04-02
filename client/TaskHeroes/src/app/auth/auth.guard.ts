import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // User is authenticated, allow access
  } else {
    // User is not authenticated, redirect to the login page
    router.navigate(['/login']);
    return false;
  }
};
