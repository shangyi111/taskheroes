import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { Provider } from 'src/app/shared/models/provider';

@Component({
  selector: 'business-form',
  standalone: true,
  styleUrls: ['./business_form.component.scss'],
  templateUrl: './business_form.component.html',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatExpansionModule],
})
export class BusinessFormComponent {
  @Input() provider: Provider | null = null;
  @Input() actionName:string |null = null;
  @Input() providerForm: FormGroup = inject(FormBuilder).group({
    businessName: ['', Validators.required],
    businessAddress: [''],
    phoneNumber: [''],
    description: [''],
    profilePicture: [''],
  });
  @Output() formSubmit = new EventEmitter<FormGroup>();
  @Output() formClear = new EventEmitter<void>();

  onSubmit(): void {
    if (this.providerForm.valid) {
      this.formSubmit.emit(this.providerForm);
    }
  }

  clearForm(): void {
    this.providerForm.reset();
    this.formClear.emit();
  }
}