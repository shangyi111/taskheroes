// business-detail.component.ts
import { Component,inject} from '@angular/core';
import { BUSINESS_PROFILE } from '../business_page.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';



@Component({
  selector: 'app-business-detail',
  templateUrl: './business_details.component.html',
  styleUrls: ['./business_details.component.scss'],
  standalone:true,
  imports: [MatCardModule, MatButtonModule,ReactiveFormsModule,
            MatChipsModule, CommonModule, MatFormFieldModule,MatInputModule], 
})
export class BusinessDetailComponent {
  businessForm!: FormGroup;  // ✅ Define a form group
  isEditing = false;
  private formBuilder =inject(FormBuilder);

  ngOnInit() {
    // ✅ Initialize the form
    this.businessForm = this.formBuilder.group({
      serviceName: ['Tidy Home Solutions', [Validators.required, Validators.minLength(3)]],
      category: ['Home Organization', Validators.required],
      description: ['Professional home organizing services.', Validators.required],
      phone: ['(123) 456-7890', [Validators.required, Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]],
      email: ['contact@tidyhome.com', [Validators.required, Validators.email]],
      website: ['www.tidyhome.com'],
      city: ['San Francisco'],
      state:['CA'],
      rating: [4.8, [Validators.required, Validators.min(0), Validators.max(5)]],
      reviewCount: [120, Validators.required]
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveChanges() {
    if (this.businessForm.valid) {
      console.log('Saved:', this.businessForm.value);
      this.isEditing = false;
    } else {
      console.log('Form is invalid!');
    }
  }
}