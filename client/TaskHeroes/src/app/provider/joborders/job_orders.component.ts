import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { SocketIoService } from 'src/app/services/socket-io.service';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { JobService } from 'src/app/services/job.service';
import { FormFieldConfig } from 'src/app/shared/ui-components/th-form/form.component';
import { ChatroomService } from 'src/app/services/chatroom.service';
import { Chatroom } from 'src/app/shared/models/chatroom';
import { UserDataService } from 'src/app/services/user_data.service';
import { Job } from 'src/app/shared/models/job';
import { JobStatus } from 'src/app/shared/models/job-status.enum';
import {MatIconModule} from '@angular/material/icon';
import {User} from 'src/app/shared/models/user';
import {switchMap,take} from 'rxjs/operators';
import {Observable, of as observableOf, Subscription} from 'rxjs';
import { ReactiveFormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormComponent } from 'src/app/shared/ui-components/th-form/form.component';
import { EmptyStateComponent } from 'src/app/shared/ui-components/th-empty-state/empty-state.component';

@Component({
  selector: 'provider-order',
  standalone: true,
  templateUrl: './job_orders.component.html', 
  styleUrls: ['./job_orders.component.scss'],
  imports: [MatCardModule,MatIconModule,MatFormFieldModule, 
            MatInputModule,MatButtonModule,FormsModule,
            CommonModule,MatChipsModule, MatExpansionModule,
            EmptyStateComponent
          ], 
})
export class JobOrdersComponent {
  private socketIoService = inject(SocketIoService);
  private chatroomService = inject(ChatroomService);
  private router = inject(Router);
  private jobService = inject(JobService);
  private readonly userData$ = inject(UserDataService).userData$;
  jobs = signal<Job[]>([]);
  customerMap = signal<Map<number, any>>(new Map());
  private jobsSubscription: Subscription | null = null;
  private socketSubscriptions: Subscription[] = [];
  ngOnInit(): void {
    this.joinUserRoom();
    this.listenForJobUpdates();
    this.loadInitialJobs();
  }

  ngOnDestroy(): void {
    if (this.jobsSubscription) {
      this.jobsSubscription.unsubscribe();
    }
    this.socketSubscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadInitialJobs(): void {

    const upcomingFilter = { 
      startDate: new Date().toISOString(), 
      order: 'ASC' 
    };

    // const pastFilter = { 
    //   endDate: new Date().toISOString(), 
    //   order: 'DESC' 
    // };
    this.jobsSubscription = this.userData$.pipe(
      switchMap((user: User | null) => {
        if (!user) return observableOf(null);
        return this.jobService.getAllJobsByPerformerId(user.id!, upcomingFilter);
      })
    ).subscribe({
      next: (loadedJobs: any[] | null) => {
        if (loadedJobs) {
          // Sort by date: soonest first
          const sorted = loadedJobs.sort((a, b) => 
            new Date(a.jobDate!).getTime() - new Date(b.jobDate!).getTime()
          );
          this.jobs.set(sorted);

          const newMap = new Map();
          loadedJobs.forEach(job  => {
            if (job.customerId) {
              newMap.set(job.customerId, job.customer.username);
            }
          });
          this.customerMap.set(newMap);
        }
      },
      error: (error) => {
        console.error('Error loading initial services:', error);
      },
    });
  }
  joinUserRoom():void{
    this.socketSubscriptions.push(
      this.userData$.pipe(take(1)).subscribe({
        next: (user) => {
          if (user && user.id) {
            this.socketIoService.connect(user.id);
            this.socketIoService.emit('join_user_room', user.id); // Use emit here
            console.log(`User ${user.id} joined room.`);
          }
        },
        error: (error) => {
          console.error('Error getting user data:', error);
        }
      })
    );
  }

  listenForJobUpdates(): void {  
    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Job>('job_created').subscribe((newJob) => {
       this.jobs.update(currentJobs => [...currentJobs, newJob]);
        console.log('Job Created (Real-time):', newJob);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Job>('job_updated').subscribe((updatedJob) => {
        this.jobs.update(prev => 
          prev.map(job => job.id === updatedJob.id ? updatedJob : job)
        );
        console.log('Job Updated (Real-time):', updatedJob);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<{ jobId: number }>('job_deleted').subscribe((data) => {
        this.jobs.update(prev => 
          prev.filter(job => job.id?.toString() !== data.jobId.toString())
        );
        console.log('Job Deleted (Real-time):', data.jobId);
        // If using OnPush, trigger change detection here
      })
    );
  }

  deleteJob(jobId: string): void {
    if (confirm('Are you sure you want to delete this job?')) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => {
          console.log(`Job with ID ${jobId} deleted successfully.`);
          // The real-time update should handle removing it from the list
        },
        error: (error) => {
          console.error('Error deleting job:', error);
        },
      });
    }
  }

  getCustomerName(id: number): string {
    return this.customerMap().get(id) || 'Unknown Customer';
  }

  contactCustomer(jobId:string):void{
    this.chatroomService.getChatroomByJobId(jobId).subscribe({
      next:(response:Chatroom[])=>{
        const chatRoom = response[0];
        this.router.navigate(['messenger',chatRoom.id])
      }
    })
  }

  calculateTotal(priceBreakdown: any[]): number {
    if (!priceBreakdown || !Array.isArray(priceBreakdown)) return 0;
    return priceBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  getStatusClass(status:JobStatus): string {
    return `status-dot ${status.toLowerCase()}`;
  }
}