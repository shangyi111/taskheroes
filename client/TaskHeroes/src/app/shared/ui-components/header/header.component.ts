import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { User } from 'src/app/shared/models/user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userDataService = inject(UserDataService);
  
  readonly userData$: Observable<User | null> = this.userDataService.userData$;
  
  // Signal to manage the dropdown visibility
  isMenuOpen = signal(false);

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  getMessagesLink(user: User): any[] {
    // Dynamic routing based on the active role
    return [user.role === 'provider' ? '/provider' : '/seeker', user.id, 'chatrooms'];
  }

  toggleRole(currentUser: User): void {
    if (!currentUser?.id) {
      this.logout();
      return;
    }
    const newRole = currentUser.role === 'seeker' ? 'provider' : 'seeker';
    localStorage.setItem('preferred_role', newRole);
    this.userDataService.updateUserData({ ...currentUser, role: newRole });
    this.isMenuOpen.set(false); // Close menu after switching

    // Redirect to the role's primary context
    if (newRole === 'provider') {
      this.router.navigate(['user', currentUser.id, 'provider']);
    } else {
      this.router.navigate(['/search']);
    }
  }

  logout(): void {
    this.isMenuOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}