import { Component, inject, signal, OnInit, OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { SocketIoService } from 'src/app/services/socket-io.service';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { JobService } from 'src/app/services/job.service';
import { ChatroomService } from 'src/app/services/chatroom.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { Chatroom } from 'src/app/shared/models/chatroom';
import {Job} from 'src/app/shared/models/job';
import {MatIconModule} from '@angular/material/icon';
import {User} from 'src/app/shared/models/user';
import {switchMap,take} from 'rxjs/operators';
import {Observable, of as observableOf, Subscription} from 'rxjs';
import { ReactiveFormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmptyStateComponent } from 'src/app/shared/ui-components/th-empty-state/empty-state.component';
import { JobStatus } from 'src/app/shared/models/job-status.enum';

@Component({
  selector: 'seeker-order',
  standalone: true,
  templateUrl: './orders.component.html', 
  styleUrls: ['./orders.component.scss'],
  imports: [MatCardModule,MatIconModule,MatFormFieldModule, 
            MatInputModule,MatButtonModule,FormsModule,
            CommonModule,MatChipsModule, MatExpansionModule,
            EmptyStateComponent
          ], // Import the required modules, including Router
})
export class OrdersComponent implements OnInit, OnDestroy{
  private chatroomService = inject(ChatroomService);
  private socketIoService = inject(SocketIoService);
  private router = inject(Router);
  private jobService = inject(JobService);
  private readonly userData$ = inject(UserDataService).userData$;
  jobs = signal<Job[]>([]);
  performerMap = signal<Map<number, string>>(new Map());
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
    this.jobsSubscription = this.userData$.pipe(
      switchMap((user: User | null) => {
        if (!user) return observableOf(null);
        return this.jobService.getAllOrdersByCustomerId(user.id!,upcomingFilter);
      })
    ).subscribe({
      next: (loadedJobs: any[] | null) => {
        if (loadedJobs) {
          // Sort by date
          const sorted = loadedJobs.sort((a: any, b: any) => 
            new Date(a.jobDate).getTime() - new Date(b.jobDate).getTime()
          );
          this.jobs.set(sorted);

          // Populate Performer Map
          const newMap = new Map<number, string>();
          loadedJobs.forEach((job) => {
            if (job.performerId && job.performer) {
              newMap.set(job.performerId, job.performer.username);
            }
          });
          this.performerMap.set(newMap);
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
        this.jobs.update(current => current.map(job => job.id === newJob.id ? newJob : job));
        console.log('Job Created (Real-time):', newJob);
        // If using OnPush, trigger change detection here
      })
    );

    this.socketSubscriptions.push(
      this.socketIoService.onUserEvent<Job>('job_updated').subscribe((updatedJob) => {
        this.jobs.update(current => current.map(job => job.id === updatedJob.id ? updatedJob : job));
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

  deleteOrder(orderId: string): void {
    if (confirm('Are you sure you want to delete this job?')) {
      this.jobService.deleteOrder(orderId).subscribe({
        next: () => {
          console.log(`Job with ID ${orderId} deleted successfully.`);
          // The real-time update should handle removing it from the list
        },
        error: (error) => {
          console.error('Error deleting job:', error);
        },
      });
    }
  }

  contactProvider(job: Job): void {
    this.chatroomService.getChatroomByJobId(job.id!)
      .pipe(
        switchMap((foundChatroom: Chatroom[] | undefined) => {
          console.log("foundChatroom",foundChatroom);
          if (foundChatroom && foundChatroom.length > 0) {
            return observableOf(foundChatroom[0]);
          } else {
            const newChatRoom = {
              name: `Chat for Job: ${job.jobTitle!}`,
              jobId: job.id!,
              customerId: job.customerId!,
              providerId: job.performerId!,
            };
            console.log("chatRoom to create",newChatRoom);
            // return observableOf(newChatRoom as Chatroom);
            return this.chatroomService.createChatroom(newChatRoom);
          }
        })
      )
      .subscribe({
        next: (chatRoom: Chatroom) => {
          this.router.navigate([ '/messenger', chatRoom.id]);
        },
        error: (err) => {
          console.error('Failed to contact provider:', err);
        }
      });
  }

  calculateTotal(priceBreakdown: any[]): number {
    if (!priceBreakdown || !Array.isArray(priceBreakdown)) return 0;
    return priceBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }
  

  getPerformerName(id: number): string {
    return this.performerMap().get(id) || 'Provider';
  }

  getStatusClass(status: JobStatus): string {
    return `status-dot ${status.toLowerCase().replace(/\s+/g, '')}`;
  }
}