import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, of, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap, tap, map, shareReplay, catchError } from 'rxjs/operators';

// Services & Models
import { ReviewService } from 'src/app/services/review.service';
import { BusinessService } from 'src/app/services/business.service';
import { JobService } from 'src/app/services/job.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { AuthService } from 'src/app/auth/auth.service'; // Added for Google Login
import { Service } from 'src/app/shared/models/service';
import { Job } from 'src/app/shared/models/job';
import { Review } from 'src/app/shared/models/review';
import { User } from 'src/app/shared/models/user';
import { environment } from 'src/environments/environment';
import { AUTH_TOKEN_KEY } from 'src/app/shared/constants';

// Sub-components
import { SeekerCalendarComponent } from 'src/app/seeker/service-details/seeker-calendar/seeker-calendar.component';
import { ServiceReviewsComponent } from './service-reviews/service-reviews.component';
// 1. Declare Google global (provided by the script in index.html)
declare var google: any;
@Component({
  selector: 'app-service-details',
  standalone: true,
  templateUrl: './service-details.component.html',
  styleUrls: ['./service-details.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SeekerCalendarComponent,
    ServiceReviewsComponent,
    MatChipsModule,
  ],
})
export class ServiceDetailsComponent implements OnInit {
  // Observables for data streaming
  service$: Observable<Service | null> = of(null);
  averageRating$: Observable<number | undefined> = of(0);
  reviewCount$: Observable<number> = of(0);
  
  // State Signals
  user: User | null = null;
  serviceId: string = '';
  providerId: string = '';
  activeImageUrl: string = '';
  currentIndex: number = 0;

  viewMode = signal<'details' | 'calendar'>('details');
  
  // Enterprise UX Signals
  showAuthOptions = signal(false);
  isSubmitting = signal(false);

  private route = inject(ActivatedRoute);
  private routeNavigator = inject(Router);
  private serviceDataService = inject(BusinessService);
  private reviewService = inject(ReviewService);
  private jobService = inject(JobService);
  private userService = inject(UserDataService);
  private authService = inject(AuthService);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);

  constructor() {
    // 2. This effect watches the showAuthOptions signal. 
    // When it turns TRUE, it waits a tick and then initializes the Google button.
    effect(() => {
      if (this.showAuthOptions()) {
        // Small delay to ensure the DOM element inside @if is rendered
        setTimeout(() => this.initializeGoogleButton(), 100);
      }
    });
  }

  setViewMode(mode: 'details' | 'calendar') {
    this.viewMode.set(mode);
  }
  ngOnInit(): void {
    this.user = this.userService.getUserData();
    this.service$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('serviceId');
        if (id) {
          this.serviceId = id;
          return this.serviceDataService.getServiceById(parseInt(id));
        }
        return of(null);
      }),
      tap(service => {
        if (service) {
          this.providerId = service.userId;
          this.fetchReviewStats(service.id!);
          if (service.portfolio && service.portfolio.length > 0) {
            this.activeImageUrl = service.portfolio[0].url;
          }
        }
      })
    );
  }

  shareService(serviceName: string): void {
    const shareData = {
      title: `${serviceName} on TaskHeroes`,
      text: `Check out ${serviceName} for professional artistic services!`,
      url: window.location.href // Current page URL
    };

    // 1. Try Native Web Share API (Mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      navigator.share(shareData)
        .then(() => console.log('Shared successfully'))
        .catch((err) => console.log('Error sharing:', err));
    } else {
      // 2. Fallback: Copy to Clipboard (Desktop)
      navigator.clipboard.writeText(shareData.url).then(() => {
        this.snackBar.open('Link copied to clipboard!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'] // You can style this in global.scss
        });
      });
    }
  }
  handleBookingSubmission(bookingDetails: Job) {
    if (!this.user || !this.user.id) {
      // 1. Preserve Intent: Save details so they aren't lost
      sessionStorage.setItem('pending_booking', JSON.stringify(bookingDetails));
      // 2. Open Decision Bridge (The Modal/Choice section in HTML)
      this.showAuthOptions.set(true); 
      return;
    }

    this.executeBooking(bookingDetails);
  }

  // Path 1: Google Login (Fastest Conversion)
  loginWithGoogle() {
    // Tell auth service to return here after successful Google OAuth
    this.authService.loginWithGoogle(this.routeNavigator.url);
  }

  // Path 2: Traditional Registration
  redirectToRegister() {
    this.routeNavigator.navigate(['/register'], { 
      queryParams: { returnUrl: this.routeNavigator.url } 
    });
  }

  // Path 3: Guest Email Request (Lowest Friction)
  submitAsGuest(email: string) {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email to send job inquiry.');
      return;
    }

    const pendingData = sessionStorage.getItem('pending_booking');
    if (!pendingData) return;

    const guestPayload = { ...JSON.parse(pendingData), guestEmail: email };
    this.isSubmitting.set(true);
  }

  private executeBooking(bookingDetails: Job) {
    this.isSubmitting.set(true);
    this.jobService.createJob(bookingDetails).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.routeNavigator.navigate(['/messenger', response.chatroomId]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error.message || 'Booking failed. Please try again.');
      }
    });
  }

  // --- UI Helpers ---

  private fetchReviewStats(serviceId: string): void {
    const reviews$ = this.reviewService.getAllReviewsByServiceId(serviceId).pipe(shareReplay(1));
    this.reviewCount$ = reviews$.pipe(
      map(res => res.totalItems || 0)
    );
    this.averageRating$ = reviews$.pipe(map(res => res.averageRating));
  }

  /**
   * Helper to map social platform strings to Material Icons.
   * Ensures your Business Profile renders the correct branding.
   */
  getSocialIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      'instagram': 'photo_camera',
      'facebook': 'facebook',
      'linkedin': 'business',
      'etsy': 'storefront',
      'website': 'language',
      'yelp': 'reviews',
      'google': 'location_on'
    };
    return icons[platform?.toLowerCase()] || 'link';
  }
  goBackToSearch(): void { 
    if (window.history.length > 1) {
      this.location.back();
    } else {
        this.routeNavigator.navigate(['/search']); // Absolute fallback
    }
  }

  setActiveImage(url: string, index: number): void {
    this.activeImageUrl = url;
    this.currentIndex = index;
  }

  nextSlide(portfolio: any[]): void {
    this.currentIndex = (this.currentIndex + 1) % portfolio.length;
    this.activeImageUrl = portfolio[this.currentIndex].url!;
  }

  prevSlide(portfolio: any[]): void {
    this.currentIndex = (this.currentIndex - 1 + portfolio.length) % portfolio.length;
    this.activeImageUrl = portfolio[this.currentIndex].url!;
  }

  private initializeGoogleButton() {
    const container = document.getElementById('google-btn-container');
    if (!container || !google) return;

    google.accounts.id.initialize({
      client_id: `${environment.googleAuthClientId}`,
      callback: (response: any) => this.handleGoogleResponse(response),
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: '100%', // Makes it responsive to your modal width
      text: 'continue_with'
    });
  }

  private handleGoogleResponse(response: any) {
    const idToken = response.credential;
    this.isSubmitting.set(true);

    this.authService.loginWithGoogle(idToken).subscribe({
      next: (userResponse: any) => {
        // Store user data and close modal
        localStorage.setItem(AUTH_TOKEN_KEY, userResponse.token);
        const authenticatedUser = {
          ...userResponse.user,
          role: userResponse.user.role || 'seeker' 
        };
        this.userService.setUserData(authenticatedUser);
        this.user = authenticatedUser;
        this.showAuthOptions.set(false);
        this.isSubmitting.set(false);

        // 5. AUTO-RESUME: Check if there's a pending booking and execute it
        const pending = sessionStorage.getItem('pending_booking');
        if (pending) {
          const bookingDetails:Job = JSON.parse(pending);
          bookingDetails.customerId = this.user!.id;
          this.executeBooking(bookingDetails);
          sessionStorage.removeItem('pending_booking');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Google Login Error:', err);
        alert('Google Login failed. Please try again.');
      }
    });
  }
}