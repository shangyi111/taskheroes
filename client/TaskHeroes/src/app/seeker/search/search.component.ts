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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
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
    EmptyStateComponent, MatPaginatorModule
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
  pageState$ = new BehaviorSubject({ page: 1, size: 10 });
  private totalServicesSubject = new BehaviorSubject<number>(0);
  readonly totalServices$ = this.totalServicesSubject.asObservable();
  readonly currentFilters$ = this.filtersSubject.asObservable();
  readonly services$: Observable<ServiceWithRating[]> = combineLatest([
      this.userData$, 
      this.currentFilters$,
      this.pageState$ // Track page changes
    ]).pipe(
      switchMap(([user, filters, pageState]) => {
        const searchParams = { 
          ...filters, 
          page: pageState.page, 
          size: pageState.size 
        };
        
        if (user?.id) {
          searchParams.excludeUserId = user.id;
        }

        return this.searchService.searchServices(searchParams);
      }),
      switchMap(services => {
        // If your searchService also returns PaginatedResponse<Service>, 
        // handle the items array here
        const serviceList = Array.isArray(services) ? services : (services as any).items;
        const totalCount = Array.isArray(services) ? services.length : (services as any).totalItems;
        
        // 3. Update the total count for the UI
        this.totalServicesSubject.next(totalCount || 0);
        if (!serviceList || serviceList.length === 0) {
          return observableOf([]);
        }
        return this.getServiceRatingObservables(serviceList);
      }),
      shareReplay(1)
  );

  private getServiceRatingObservables(services: Service[]): Observable<ServiceWithRating[]> {
    const serviceWithRatings$ = services.map(service => 
      // Fetch only 1 item to get the metadata (totalItems & averageRating)
      this.reviewService.getAllReviewsByServiceId(service.id!, 1, 1).pipe(
        map(res => {
          // Use the metadata we added to the backend/interface
          const reviewCount = res.totalItems || 0;
          const averageRating = reviewCount > 0 ? (res.averageRating ?? null) : null;
          
          return {
            ...service,
            averageRating,
            reviewCount
          } as ServiceWithRating;
        }),
        catchError(() => observableOf({ 
          ...service, 
          averageRating: null, 
          reviewCount: 0 
        } as ServiceWithRating))
      )
    );
    
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

  onPageChange(event: PageEvent): void {
    this.pageState$.next({
      page: event.pageIndex + 1, // Material is 0-indexed, Backend is 1-indexed
      size: event.pageSize
    });
    
    // Optional: Scroll to top after page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}