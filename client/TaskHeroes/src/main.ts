import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // Import your config file

bootstrapApplication(AppComponent, appConfig) // Pass the config object here
  .catch((err) => console.error(err));