import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserDataService } from 'src/app/services/user_data.service';
import { ThLoadingComponent } from '../th-loading/loading.component';
import { ActivatedRoute } from '@angular/router';

type VerificationStatus = 'idle' | 'processing' | 'success' | 'canceled' | 'error';
@Component({
  selector: 'verification-banner',
  standalone: true,
  imports: [CommonModule, ThLoadingComponent],
  templateUrl: './verification-banner.component.html',
  styleUrls: ['./verification-banner.component.scss']
})
export class VerificationBannerComponent {
  private readonly API_URL = 'http://localhost:3000/api/identity';
  private route = inject(ActivatedRoute);
  private userDataService = inject(UserDataService);
  private http = inject(HttpClient);
  
  isLoading = signal(false);
  user = computed(() => this.userDataService.userSignal());

  // Computed signal to determine visibility
  isVisible = computed(() => {
    const u = this.user();
    return !!u && u.username !== 'Guest' && !u.isIdentityVerified;
  });

  statusMessage = computed(() => {
    const status = this.user()?.stripeVerificationStatus;
    if (status === 'processing') return 'Analyzing documents...';
    if (status === 'requires_input') return 'Action required for identity verification.';
    return 'Verify identity for 2026 bookings.';
  });

  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: any) {
    if (event.persisted) this.isLoading.set(false);
  }

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    // We only trigger the sync if the URL explicitly tells us the user just returned
    if (params.get('identity_status') === 'returned') {
      this.syncAndPoll();
    }
  }

  private syncAndPoll() {
    const user = this.userDataService.userSignal();
    if (!user?.id) return;
    
    this.isLoading.set(true); 

    // Sync profile to get the latest 'stripeVerificationStatus' from the Webhook
    this.userDataService.fetchAndSyncProfile(user.id).subscribe({
      next: (updatedUser) => {
        // If it's still processing, we wait 4 seconds for the webhook to finalize
        if (updatedUser?.stripeVerificationStatus === 'processing' && !updatedUser.isIdentityVerified) {
          setTimeout(() => {
            this.userDataService.fetchAndSyncProfile(user.id!).subscribe(() => this.isLoading.set(false));
          }, 4000);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

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