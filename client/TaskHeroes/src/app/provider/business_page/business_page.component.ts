import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'business_page',
  standalone: true,
  templateUrl: './business_page.component.html', 
//   styleUrls: ['./business_page.component.scss'],
  imports: [MatCardModule, MatButtonModule], // Import the required modules, including Router
})
export class BusinessPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(){
    console.log("inside business page");
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}