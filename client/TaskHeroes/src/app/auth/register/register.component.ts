import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {User} from 'src/app/shared/models/user';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html', // Pointing to the HTML file in the same directory
})
export class RegistrationComponent {
  email = '';
  newUsername = '';
  newPassword = '';
  errorMessage: string | null = null;
  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    this.errorMessage = null;
    const newUser:User = {
      email:this.email,
      username:this.newUsername,
      password:this.newPassword,
    }
    this.authService.register(newUser).subscribe({
      next: (user:User) => {
        alert('Registration successful! Please log in.');
        console.log(user,"registered .");
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error.error.message;
      },
    });
  }
}