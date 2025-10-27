import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
   provideHttpClient(
      withInterceptors([
        authInterceptor // Your authentication interceptor is now registered
      ])
    ),
    // Add other providers here if needed, e.g., for state management
  ],
}).catch((err) => console.error(err));