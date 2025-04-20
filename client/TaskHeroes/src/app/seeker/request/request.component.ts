import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Job } from 'src/app/shared/models/job';
import { CommonModule } from '@angular/common';
import { FormComponent } from 'src/app/ui-components/th-form/form.component';
import { FormFieldConfig } from 'src/app/ui-components/th-form/form.component';
import { JobService } from 'src/app/services/job.service';
import { Service } from 'src/app/shared/models/service';
import { User } from 'src/app/shared/models/user';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserDataService } from 'src/app/services/user_data.service';
import { Observable, of as observableOf } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
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
    private activatedRoute = inject(ActivatedRoute);
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
            const newJob: Job = {
                ...formGroup.value,
                userId: this.userId!,
                serviceId: this.serviceId!,
            };
            this.jobService.createJob(newJob).subscribe({
                next: (createdJob) => {
                    if (createdJob) {
                        console.log('Job created via API:', createdJob);
                        this.clearForm(); 
                    }
                },
                error: (error) => {
                    console.error('Error creating job:', error);
                },
            });
    }}

    clearForm(): void {
        this.requestForm.reset();
        //this.serviceBeingEdited = null;
    }

    cancel(): void {
        this.route.navigate(['/user',this.userId,'seeker'])
    }
}