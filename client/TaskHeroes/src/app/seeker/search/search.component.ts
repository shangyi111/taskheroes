import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'search',
  standalone: true,
  templateUrl: './search.component.html', 
//   styleUrls: ['./search.component.scss'],
  imports: [MatCardModule, MatButtonModule], // Import the required modules, including Router
})
export class SearchComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}