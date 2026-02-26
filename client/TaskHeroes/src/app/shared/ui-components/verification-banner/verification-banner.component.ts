import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service'; 
import { UserDataService } from 'src/app/services/user_data.service';

@Component({
  selector: 'verification-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification-banner.component.html',
  styleUrls: ['./verification-banner.component.scss']
})
export class VerificationBannerComponent {
  private readonly API_URL = 'http://localhost:3000/api/identity';
  private authService = inject(AuthService);
  private userDataService = inject(UserDataService);
  private http = inject(HttpClient);
  
  isLoading = signal(false);

  // Computed signal to determine visibility
  isVisible = computed(() => {
    const user = this.userDataService.userSignal();
    if (!user || user.username === 'Guest') return false;
    return !user.isIdentityVerified;
  });

  startVerification() {
    this.isLoading.set(true);
    
    // This hits the backend endpoint we discussed to create a Stripe session
    this.http.post<{ url: string }>(`${this.API_URL}/verify`, {}).subscribe({
      next: (res) => {
        // Redirect to Stripe's secure hosted page
        window.location.href = res.url;
      },
      error: (err) => {
        console.error('Failed to initiate verification:', err);
        this.isLoading.set(false);
      }
    });
  }
}