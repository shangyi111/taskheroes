import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service'; 
import { User } from 'src/app/shared/models/user';
import { UserDataService } from 'src/app/services/user_data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html', 
  styleUrl:'./login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;
  private readonly authService = inject(AuthService);
  private readonly userDataService = inject(UserDataService);
  private router = inject(Router);

  onSubmit() {
  this.errorMessage = null;
  const confidential: User = { email: this.email, password: this.password };
  
  this.authService.login(confidential).subscribe({
    next: (user: User) => {
      
      // 2. Remember the role for this device
      // You can check if a preference already exists, otherwise use the user's default
      const storageRole = localStorage.getItem('preferred_role');
      const userRole = user?.role;
      let savedRole: string;

      if (storageRole === 'provider' || userRole === 'provider') {
        savedRole = 'provider';
      } else if (storageRole === 'seeker' || userRole === 'seeker') {
        savedRole = 'seeker';
      } else {
        // 3. Fallback: If it's the string "undefined", null, or anything else
        savedRole = 'seeker';
      }
      localStorage.setItem('preferred_role', savedRole!);

      const finalizedUser = { ...user, role: savedRole };
      this.userDataService.setUserData(finalizedUser);
      // 3. Smart Redirection based on stored role
      if (savedRole === 'provider') {
        this.router.navigate(['/provider', user.id]); 
      } else {
        this.router.navigate(['/search']); // Standard Seeker landing
      }
    },
    error: (error) => {
      this.errorMessage = error.error?.message || 'Login failed';
    },
  });
}
}