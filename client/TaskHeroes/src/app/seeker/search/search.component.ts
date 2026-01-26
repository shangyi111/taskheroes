import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FilterComponent } from './filter/filter.component';
import { Service } from 'src/app/shared/models/service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserDataService } from 'src/app/services/user_data.service';
import { Observable, of as observableOf, shareReplay, BehaviorSubject, combineLatest, forkJoin, map, } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { MatChipsModule } from '@angular/material/chips';
import { SearchService } from 'src/app/services/search.service';
import { ReviewService } from 'src/app/services/review.service';
import { EmptyStateComponent } from 'src/app/shared/ui-components/th-empty-state/empty-state.component';

interface ServiceWithRating extends Service {
  averageRating: number | null;
  reviewCount: number;
}
@Component({
  selector: 'search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  imports: [MatCardModule, MatButtonModule, FilterComponent, CommonModule, MatIconModule, MatChipsModule,
    EmptyStateComponent
  ],
})
export class SearchComponent {
  private searchService = inject(SearchService);
  private reviewService = inject(ReviewService);
  readonly userData$ = inject(UserDataService).userData$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private route = inject(Router);
  private filtersSubject = new BehaviorSubject<any>({});
  readonly currentFilters$ = this.filtersSubject.asObservable();
  readonly services$: Observable<ServiceWithRating[]> = combineLatest([this.userData$, this.currentFilters$]).pipe(
    switchMap(([user, filters]) => {
      // Prepare search params
      const searchParams = { ...filters };
      
      // Only exclude ID if a user actually exists
      if (user?.id) {
        searchParams.excludeUserId = user.id;
      }

      return this.searchService.searchServices(searchParams);
    }),
    switchMap(services => {
      if (!services || services.length === 0) {
        return observableOf([]);
      }
      return this.getServiceRatingObservables(services);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError((error) => {
      console.error('Error loading services:', error);
      return observableOf([]);
    })
  );

  private getServiceRatingObservables(services: Service[]): Observable<ServiceWithRating[]> {
    const serviceWithRatings$ = services.map(service => 
      this.reviewService.getAllReviewsByServiceId(service.id!).pipe(
        map(reviews => {
          const reviewCount = reviews.length;
          let averageRating: number | null = null;
          
          if (reviewCount > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            averageRating = parseFloat((totalRating / reviewCount).toFixed(1)); 
          }
          
          // Return the new object with the calculated properties
          return {
            ...service,
            averageRating,
            reviewCount
          } as ServiceWithRating;
        }),
        catchError(() => {
          // Return default object on review fetch error
          return observableOf({ 
            ...service, 
            averageRating: null, 
            reviewCount: 0 
          } as ServiceWithRating);
        })
      )
    );
    
    // Wait for all individual rating Observables to complete
    return forkJoin(serviceWithRatings$);
  }

  handleFiltersChanged(filters: any): void {
    this.filtersSubject.next(filters);
  }

  request(service: Service, userId?: string): void {
    if (!userId) this.route.navigate(['/login']);
    this.route.navigate(['/user', userId, 'service', service.id, 'request']);
  }

  viewServiceDetails(service: Service): void {
    this.route.navigate(['service', service.id]); 
  }
}