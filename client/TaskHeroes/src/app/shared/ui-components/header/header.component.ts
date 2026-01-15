import { Router,RouterLink,RouterModule} from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service'; 
import { Component, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Observable } from 'rxjs';
import { UserDataService } from 'src/app/services/user_data.service';
import {User} from 'src/app/shared/models/user';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink,CommonModule,RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userDataService = inject(UserDataService);
  readonly userData$ : Observable<User | null>= inject(UserDataService).userData$;

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  toggleRole(currentUser: User): void {
    if (!currentUser?.id) {
      console.error('User ID is undefined. Redirecting to login.');
      this.logout();
      return;
    }
    const newRole = currentUser.role === 'seeker' ? 'provider' : 'seeker';
    
    // 1. Update the global state so the header UI updates immediately
    this.userDataService.updateUserData({ ...currentUser, role: newRole });

    // 2. Navigate the user to their new dashboard
    this.router.navigate(['user', currentUser.id, newRole]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}