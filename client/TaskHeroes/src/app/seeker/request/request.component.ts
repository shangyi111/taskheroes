import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Job } from 'src/app/shared/models/job';
import { CommonModule } from '@angular/common';
import { FormComponent } from 'src/app/shared/ui-components/th-form/form.component';
import { FormFieldConfig } from 'src/app/shared/ui-components/th-form/form.component';
import { JobService } from 'src/app/services/job.service';
import { BusinessService } from 'src/app/services/business.service';
import { ChatroomService } from 'src/app/services/chatroom.service';
import { Service } from 'src/app/shared/models/service';
import { User } from 'src/app/shared/models/user';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserDataService } from 'src/app/services/user_data.service';
import { Observable, of as observableOf } from 'rxjs';
import { switchMap, take ,map,catchError} from 'rxjs/operators';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';

@Component({
    selector: 'request',
    standalone: true,
    templateUrl: './request.component.html',
    styleUrls: ['./request.component.scss'],
    imports: [MatCardModule, MatButtonModule, FormComponent, CommonModule],
})
export class RequestComponent {
    private jobService = inject(JobService);
    private businessService = inject(BusinessService);
    private activatedRoute = inject(ActivatedRoute);
    private chatroomService = inject(ChatroomService);
    private route = inject(Router);
    userId:number | null = null;
    serviceId:number | null = null;
    ngOnInit() {
        this.activatedRoute.params.pipe(take(1)).subscribe(params => {
          this.userId = +params['userId'];
          this.serviceId = +params['serviceId'];
        });
      }

    requestForm: FormGroup = inject(FormBuilder).group({
        jobTitle: ['', Validators.required],
        location: [''],
        zipCode:[''],
        phoneNumber: [''],
        description: [''],
        fee:[''],
        hourlyRate:[''],
        jobDate: [''],
        // Add other form fields as needed
    });

    formFields: FormFieldConfig[] = [
        { name: 'jobTitle', label: 'Job Title', type: 'text', validators: [Validators.required] },
        { name: 'location', label: 'Job location', type: 'text', validators: [] },
        { name: 'zipCode', label: 'Zip code', type: 'number', validators: [] },
        { name: 'phoneNumber', label: 'Phone Number', type: 'tel', validators: [] },
        { name: 'description', label: 'Description', type: 'text', validators: [] },
        { name: 'fee', label: 'Budget', type: 'text', validators: [] },
        { name: 'hourlyRate', label: 'Hourly Rate', type: 'number', validators: [] },
        { name: 'jobDate', label: 'Job date', type: 'date', validators: [Validators.required] },
    ];

    onAddSubmit(formGroup: FormGroup) {
        if (formGroup.valid && this.userId && this.serviceId) {
            this.businessService.getServiceById(this.serviceId).pipe(
                map(service => {
                    // Ensure service and performerId exist before assigning
                    if (service && service.userId) {
                        const newJob :Job= {
                            ...formGroup.value,
                            customerId: this.userId,
                            serviceId: this.serviceId,
                            performerId:service.userId,
                        };
                        return newJob;
                    } else {
                        console.error('Service or performerId not found for serviceId:', this.serviceId);
                        throw new Error('Performer ID not available'); // Propagate error to catch
                    }
                }),
                switchMap(jobWithPerformerId => {
                    // Now that newJob has performerId, create the job
                    return this.jobService.createJob(jobWithPerformerId).pipe(
                        switchMap(createdJob => {
                            if (createdJob && createdJob.id && createdJob.performerId) { // Ensure id and performerId are present
                                console.log('Job created via API:', createdJob);
    
                                const newChatroom = {
                                    name: `Chat for Job: ${createdJob.jobTitle}`,
                                    jobId: createdJob.id,
                                    customerId: this.userId!.toString(), // userId is already checked to be not null
                                    providerId: createdJob.performerId, // Use performerId from the created job
                                };
                                return this.chatroomService.createChatroom(newChatroom);
                            } else {
                                console.error('Job creation failed or missing ID/performerId:', createdJob);
                                return observableOf(null); // Return null to prevent further processing
                            }
                        }),
                        catchError(jobError => {
                            console.error('Error creating job:', jobError);
                            return observableOf(null); // Handle error and continue the stream with null
                        })
                    );
                }),
                catchError(serviceError => {
                    console.error('Error getting service or performerId:', serviceError);
                    return observableOf(null); // Handle error and stop the stream
                })
            ).subscribe({
                next: (createdChatroom) => {
                    if (createdChatroom) {
                        console.log('Chatroom created:', createdChatroom);
                        this.clearForm();
                        this.route.navigate(['/user', this.userId, 'seeker']); // Navigate after both are created
                    }
                },
                error: (error) => {
                    console.error('Error creating job or chatroom:', error);
                },
            });
        }
    }

    clearForm(): void {
        this.requestForm.reset();
        //this.serviceBeingEdited = null;
    }

    cancel(): void {
        this.route.navigate(['/user',this.userId,'seeker'])
    }
}