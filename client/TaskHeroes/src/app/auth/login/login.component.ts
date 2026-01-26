import { Component, inject, AfterViewInit, signal } from '@angular/core'; // Added AfterViewInit, signal
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service'; 
import { User } from 'src/app/shared/models/user';
import { UserDataService } from 'src/app/services/user_data.service';
import { environment } from 'src/environments/environment'; // Required for client ID

declare var google: any; // 🟢 Required to access Google script

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html', 
  styleUrl:'./login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  email = '';
  password = '';
  errorMessage: string | null = null;
  isSubmitting = signal(false); // 🟢 Useful for loading states

  private readonly authService = inject(AuthService);
  private readonly userDataService = inject(UserDataService);
  private router = inject(Router);

  // 🟢 Initialize Google Button after view loads
  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleAuthClientId,
        callback: (response: any) => this.handleGoogleResponse(response)
      });

      google.accounts.id.renderButton(
        document.getElementById('google-login-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      );
    }
  }

  // 🟢 Process Google Login
  private handleGoogleResponse(response: any): void {
    this.isSubmitting.set(true);
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (user: User) => {
        this.processLoginSuccess(user);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage = error.error?.message || 'Google Login failed';
      }
    });
  }

  onSubmit() {
    this.errorMessage = null;
    const confidential: User = { email: this.email, password: this.password };
    this.isSubmitting.set(true);
    
    this.authService.login(confidential).subscribe({
      next: (user: User) => this.processLoginSuccess(user),
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage = error.error?.message || 'Login failed';
      },
    });
  }

  // 🟢 Shared logic for both traditional and Google login
  private processLoginSuccess(user: User): void {
    const storageRole = localStorage.getItem('preferred_role');
    const userRole = user?.role;
    let savedRole: string;

    if (storageRole === 'provider' || userRole === 'provider') {
      savedRole = 'provider';
    } else {
      savedRole = 'seeker';
    }
    
    localStorage.setItem('preferred_role', savedRole);
    const finalizedUser = { ...user, role: savedRole };
    this.userDataService.setUserData(finalizedUser);
    
    this.isSubmitting.set(false);

    if (savedRole === 'provider') {
      this.router.navigate(['/provider', user.id]); 
    } else {
      this.router.navigate(['/search']); 
    }
  }
}