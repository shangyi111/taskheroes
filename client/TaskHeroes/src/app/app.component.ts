import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from 'src/app/shared/ui-components/header/header.component';
import { FooterComponent } from 'src/app/shared/ui-components/footer/footer.component';
import { VerificationBannerComponent } from './shared/ui-components/verification-banner/verification-banner.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, VerificationBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'TaskHeroes';
  private authService = inject(AuthService); 
}