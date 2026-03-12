import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AUTH_TOKEN_KEY } from '../shared/constants';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Catch both 401 (Missing Token) and 403 (Expired/Invalid Token)
      if (error.status === 401 || error.status === 403) {
        console.warn('🔒 Token expired or unauthorized. Forcing logout...');
        
        // 1. Wipe the token directly from local storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        
        // 2. Perform a hard browser redirect! 
        // This destroys all Angular memory (Signals/Subjects) and guarantees a clean slate.
        window.location.href = '/login';
      }
      
      // Let the error pass through in case a specific component wants to read it
      return throwError(() => error); 
    })
  );
};