import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FilterComponent } from './filter/filter.component';
import { Service } from 'src/app/shared/models/service';
import { User } from 'src/app/shared/models/user';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserDataService } from 'src/app/services/user_data.service';
import { Observable, of as observableOf, shareReplay, BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  imports: [MatCardModule, MatButtonModule, FilterComponent, CommonModule],
})
export class SearchComponent {
  private searchService = inject(SearchService);
  readonly userData$ = inject(UserDataService).userData$.pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private route = inject(Router);
  private filtersSubject = new BehaviorSubject<any>({});
  readonly currentFilters$ = this.filtersSubject.asObservable();
  readonly services$: Observable<Service[]> = combineLatest([this.userData$, this.currentFilters$]).pipe(
    switchMap(([user, filters]) => {
      if (!user) {
        return observableOf([]);
      }
      return this.searchService.searchServices({ ...filters, excludeUserId: user.id });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError((error) => {
      console.error('Error loading services:', error);
      return observableOf([]);
    })
  );

  handleFiltersChanged(filters: any): void {
    this.filtersSubject.next(filters);
  }

  request(service: Service, userId?: string): void {
    if (!userId) this.route.navigate(['/login']);
    this.route.navigate(['/user', userId, 'service', service.id, 'request']);
  }
}