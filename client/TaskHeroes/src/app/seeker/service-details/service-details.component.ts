import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { SeekerCalendarComponent } from 'src/app/seeker/service-details/seeker-calendar/seeker-calendar.component';
import { BusinessService } from 'src/app/services/business.service';
import { JobService } from 'src/app/services/job.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { Service } from 'src/app/shared/models/service';
import { Job } from 'src/app/shared/models/job';
import { User } from 'src/app/shared/models/user';

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
  ],
})
export class ServiceDetailsComponent implements OnInit {
  
  // Observables for data streaming
  service$: Observable<Service | null> = of(null);
  user: User | null = null;
  serviceId: string = '';
  providerId: string = '';
  
  private route = inject(ActivatedRoute);
  private serviceDataService = inject(BusinessService);
  private jobService = inject(JobService);
  private userService = inject(UserDataService);

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
          // Note: You would also fetch the current seeker/customer's ID from AuthService here if needed
        }
      })
    );
  }
  
  // ParentComponent.ts
handleBookingSubmission(bookingDetails: Job) {
  // This is where the actual backend service call happens
  this.jobService.createJob(bookingDetails).subscribe({
    next: (response) => {
      console.log('Booking submitted successfully!', response);
      // Show success message, redirect to confirmation page
    },
    error: (err) => {
      console.error('Booking failed:', err);
      // Show error message
    }
  });
}
}