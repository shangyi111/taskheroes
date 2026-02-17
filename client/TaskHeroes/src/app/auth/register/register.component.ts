import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/shared/models/user';
import { AuthService } from 'src/app/auth/auth.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { environment } from 'src/environments/environment';

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegistrationComponent {
  email = '';
  newUsername = '';
  newPassword = signal('');
  errorMessage: string | null = null;
  isSubmitting = signal(false);
  private authService = inject(AuthService);
  private userDataService = inject(UserDataService);
  private router = inject(Router);

  passwordRequirements = computed(() => {
    const p = this.newPassword();
    return {
      length: p.length >= 10,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /\d/.test(p),
      hasSpecial: /[@$!%*?&]/.test(p),
      // Full regex match for final validation
      isValid: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(p)
    };
  });
  
  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleAuthClientId,
        callback: (response: any) => this.handleGoogleResponse(response)
      });

      google.accounts.id.renderButton(
        document.getElementById('google-reg-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' }
      );
    }
  }

  private handleGoogleResponse(response: any): void {
    this.isSubmitting.set(true);
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (user: User) => this.processLoginSuccess(user),
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage = error.error?.message || 'Google Registration failed';
      }
    });
  }

  onSubmit() {
    this.errorMessage = null;
    this.isSubmitting.set(true);
    const newUser:User = {
      email:this.email,
      username:this.newUsername,
      password:this.newPassword(),
    }
    this.authService.register(newUser).subscribe({
      next: (user:User) => {
        alert('Registration successful! Please log in.');
        this.processLoginSuccess(user);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage = error.error.message;
      },
    });
  }

  private processLoginSuccess(user: User): void {
    const storageRole = localStorage.getItem('preferred_role') || 'seeker';
    localStorage.setItem('preferred_role', storageRole);
    
    const finalizedUser = { ...user, role: storageRole };
    this.userDataService.setUserData(finalizedUser);
    this.isSubmitting.set(false);

    if (storageRole === 'provider') {
      this.router.navigate(['/provider', user.id]); 
    } else {
      this.router.navigate(['/search']); 
    }
  }
}