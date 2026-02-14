import { Component, Input, OnInit, inject, numberAttribute } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Include DatePipe for HTML template
import { Observable, of, BehaviorSubject } from 'rxjs';
import { switchMap,catchError} from 'rxjs/operators';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ReviewService } from 'src/app/services/review.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { Review } from 'src/app/shared/models/review';
import { map, shareReplay } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { PaginatedResponse } from 'src/app/shared/models/pagination';
import { ThLoadingComponent } from 'src/app/shared/ui-components/th-loading/loading.component';
import { EmptyStateComponent } from 'src/app/shared/ui-components/th-empty-state/empty-state.component';

export type EnrichedReview = Review & { 
  reviewerUsername?: string,
  reviewerAvatar?: string
 };
@Component({
  selector: 'app-service-reviews',
  standalone: true,  
  templateUrl: './service-reviews.component.html',
  styleUrls: ['./service-reviews.component.scss'],
  imports: [CommonModule, MatIconModule, MatCardModule, EmptyStateComponent
    , MatPaginatorModule, ThLoadingComponent], 
})
export class ServiceReviewsComponent implements OnInit {
  
  @Input({ required: true, transform: numberAttribute }) serviceId!: string;
  
  private reviewService = inject(ReviewService);
  private userDataService = inject(UserDataService);
  private pageState$ = new BehaviorSubject({ page: 1, size: 5 });
  private reviewsData$: Observable<PaginatedResponse<Review>> = of({
    items: [], totalItems: 0, totalPages: 0, currentPage: 1
  });
  enrichedReviews$: Observable<EnrichedReview[]> = of([]);
  totalItems$: Observable<number> = of(0);
  averageRating$: Observable<number | undefined> = of(0);

  ngOnInit(): void {
    if (this.serviceId) {
      // Fetch reviews and cache the result
      this.reviewsData$ = this.pageState$.pipe(
        switchMap(state => 
          this.reviewService.getAllReviewsByServiceId(this.serviceId, state.page, state.size)
        ),
        shareReplay(1)
      );
      
      this.enrichedReviews$ = this.reviewsData$.pipe(
        switchMap(response => {
          const reviews : Review[]= response.items.filter(r => r.comment?.trim());
          if (reviews.length === 0) return of([]);

          // Get unique IDs for this page only
          const uniqueIds = [...new Set(reviews.map(r => r.reviewerId))]
                            .filter((id): id is string => !!id);
          return this.userDataService.getUsersBatch(uniqueIds).pipe(
            map(users => {
              const userMap = new Map(users.map(u => [u.id, u]));
              return reviews.map(r => ({
                ...r,
                reviewerUsername: userMap.get(r.reviewerId)?.username || 'Anonymous User',
                reviewerAvatar: userMap.get(r.reviewerId)?.profilePicture
              }));
            }),
            catchError(() => of(reviews.map(r => ({ ...r, reviewerUsername: 'User' }))))
          );
        })
      );

      // 4. Derive stats from the paginated response
      this.totalItems$ = this.reviewsData$.pipe(map(res => res.totalItems));
      
      // Note: If you want global average, your backend should ideally return it 
      // in the PaginatedResponse meta-data to avoid client-side calculation.
      this.averageRating$ = this.reviewsData$.pipe(map(res => res.averageRating));
    }
  }
  onPageChange(event: PageEvent): void {
    this.pageState$.next({
      page: event.pageIndex + 1, // backend is 1-based
      size: event.pageSize
    });
  }
}