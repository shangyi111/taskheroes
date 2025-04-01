import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from 'src/app/ui-components/header/header.component';
import { FooterComponent } from 'src/app/ui-components/footer/footer.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'TaskHeroes';
  private authService = inject(AuthService); 
}