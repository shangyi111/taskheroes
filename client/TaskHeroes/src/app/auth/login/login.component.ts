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
    const confidential:User = { email: this.email, password: this.password };
    this.authService.login(confidential).subscribe({
      next: (user:User) => {
        this.userDataService.setUserData(user);
        this.router.navigate([`/user/${user.id}`]);
      },
      error: (error) => {
        this.errorMessage = error.error.message;
      },
    });
  }
}