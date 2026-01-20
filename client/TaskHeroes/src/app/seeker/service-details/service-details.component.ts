import { Component, OnInit, inject } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ReviewService } from 'src/app/services/review.service';
import { Review } from 'src/app/shared/models/review';
import { map , shareReplay} from 'rxjs/operators';
import { SeekerCalendarComponent } from 'src/app/seeker/service-details/seeker-calendar/seeker-calendar.component';
import { BusinessService } from 'src/app/services/business.service';
import { MatChipsModule } from '@angular/material/chips';
import { JobService } from 'src/app/services/job.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { Service } from 'src/app/shared/models/service';
import { Job } from 'src/app/shared/models/job';
import { User } from 'src/app/shared/models/user';
import { ServiceReviewsComponent } from './service-reviews/service-reviews.component';
import { AnalyzeResponse } from 'cloudinary';

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
  averageRating$: Observable<number> = of(0);
  reviewCount$: Observable<number> = of(0);
  user: User | null = null;
  serviceId: string = '';
  providerId: string = '';
  activeImageUrl: string = '';
  currentIndex: number = 0;
  
  private route = inject(ActivatedRoute);
  private routeNavigator = inject(Router);
  private serviceDataService = inject(BusinessService);
  private reviewService = inject(ReviewService);
  private jobService = inject(JobService);
  private userService = inject(UserDataService);
  private location = inject(Location);

  ngOnInit(): void {
    this.user = this.userService.getUserData();
    // 1. Get the serviceId from the route parameters
    this.service$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('serviceId');
        if (id) {
          this.serviceId = id;
          // 2. Fetch the full service data
          return this.serviceDataService.getServiceById(parseInt(id));
        }
        return of(null); // Return null if ID is missing
      }),
      tap(service => {
        if (service) {
          // 3. Extract the providerId once service data is available
          this.providerId = service.userId; // Assuming provider ID is stored as userId in your Service model
          this.fetchReviewStats(service.id!);
          if (service.portfolio && service.portfolio.length > 0) {
            this.activeImageUrl = service.portfolio[0].url;
          }
        }
      })
    );
  }
  
  // ParentComponent.ts
handleBookingSubmission(bookingDetails: Job) {
  // This is where the actual backend service call happens
  this.jobService.createJob(bookingDetails).subscribe({
    next: (response:{job:Job, chatroomId:number}) => {
      console.log('Booking submitted successfully!', response);
      // Show success message, redirect chatroom
      this.routeNavigator.navigate(['/chatroom', response.chatroomId]);
    },
    error: (err) => {
      console.error('Booking failed:', err);
      alert(err.error.message || 'Booking failed. Please try again.');
    }
  });
}

  private fetchReviewStats(serviceId: string): void {
    const reviews$ = this.reviewService.getAllReviewsByServiceId(serviceId).pipe(
      shareReplay(1) // Avoid re-fetching reviews if multiple subscriptions happen
    );

    this.reviewCount$ = reviews$.pipe(map(reviews => reviews.length));
    
    this.averageRating$ = reviews$.pipe(
      map(reviews => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        return total / reviews.length;
      })
    );
  }

  goBackToSearch(): void {
    // Uses the browser's history API to go back one step
    this.location.back();
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
}