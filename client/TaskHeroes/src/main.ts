import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// import { httpInterceptor } from './app/core/http-interceptor'; // Example interceptor

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Provide HttpClient with interceptors
    // Add other providers here if needed, e.g., for state management
  ],
}).catch((err) => console.error(err));