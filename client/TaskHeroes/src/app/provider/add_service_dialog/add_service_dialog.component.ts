import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BusinessService } from 'src/app/services/business.service';
import { UserDataService } from 'src/app/services/user_data.service';
import { FormComponent, FormFieldConfig } from 'src/app/shared/ui-components/th-form/form.component';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { signal } from '@angular/core';


@Component({
  selector: 'add-service-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, FormComponent],
  templateUrl: './add_service_dialog.component.html',
  styleUrls: ['./add_service_dialog.component.scss']
})
export class AddServiceDialogComponent {
  public data = inject(MAT_DIALOG_DATA); 
  
  // Determine if we are editing or creating
  isEditMode = !!this.data?.isEdit;
  initialData = this.data?.service || null;
  isLoading = signal(false);

  private dialogRef = inject(MatDialogRef<AddServiceDialogComponent>);
  private businessService = inject(BusinessService);
  private userDataService = inject(UserDataService);
  private router = inject(Router);

  // Reuse your existing form field configuration
  formFields: FormFieldConfig[] = [
    { name: 'businessName', label: 'Service Name', type: 'text', validators: [Validators.required] },
    { name: 'category', label: 'Category', type: 'text', validators: [Validators.required] },
    { name: 'hourlyRate', label: 'Hourly Rate', type: 'number', validators: [Validators.required] },
    { name: 'zipCode', label: 'Zip Code', type: 'text', validators: [] },
    { name: 'description', label: 'Description', type: 'text', validators: [] },
    { name: 'profilePicture', label: 'Profile Picture URL', type: 'url', validators: [] },
  ];

  onAddSubmit(formGroup: FormGroup) {
    if (formGroup.valid) {
      this.isLoading.set(true);   
      this.userDataService.userData$.pipe(take(1)).subscribe(user => {
        if (user) {
          const serviceData = { ...formGroup.value, userId: user.id };
          if (this.isEditMode) {
            this.businessService.updateService(this.initialData.id, serviceData)
                .subscribe({
                    next: () => {
                    this.isLoading.set(false);
                    this.dialogRef.close(true);
                    },
                    error: () => this.isLoading.set(false) // Stop shimmer on error
                });
          } else {
            this.businessService.createService(serviceData).subscribe(createdService => {
                this.dialogRef.close(true);
                // Navigate to management page so they can set the calendar immediately
                this.router.navigate(['user', user.id, 'provider', 'manage', createdService.id]);
            });
        }
        }
      });
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}