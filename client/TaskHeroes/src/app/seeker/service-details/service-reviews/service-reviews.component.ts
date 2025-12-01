import { Component, Input, OnInit, inject, numberAttribute } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Include DatePipe for HTML template
import { Observable, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ReviewService } from 'src/app/services/review.service';
import { Review } from 'src/app/shared/models/review';
import { map, shareReplay } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-service-reviews',
  standalone: true,  
  templateUrl: './service-reviews.component.html',
  styleUrls: ['./service-reviews.component.scss'],
  imports: [CommonModule, MatIconModule, MatCardModule], 
})
export class ServiceReviewsComponent implements OnInit {
  
  @Input({ required: true, transform: numberAttribute }) serviceId!: string;
  
  private reviewService = inject(ReviewService);
  reviews$: Observable<Review[]> = of([]);
  averageRating$: Observable<number> = of(0);

  ngOnInit(): void {
    if (this.serviceId) {
      // Fetch reviews and cache the result
      const reviewsData$ = this.reviewService.getAllReviewsByServiceId(this.serviceId).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      
      this.reviews$ = reviewsData$.pipe(
        // Ensure only reviews with text content are shown in the list
        map(reviews => reviews.filter(r => r.review && r.review.length > 0)) 
      );

      this.averageRating$ = reviewsData$.pipe(
        map(reviews => {
          if (reviews.length === 0) return 0;
          const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          return total / reviews.length;
        })
      );
    }
  }
}