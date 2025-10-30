import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatInput } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; 
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AddressAutocompleteDirective, AddressDetails } from '../../directives/address-autocomplete.directive';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: string;
  validators: ValidatorFn[];
}

@Component({
  selector: 'th-form',//th for task heroes
  standalone: true,
  styleUrls: ['./form.component.scss'],
  templateUrl: './form.component.html',
  imports: [ReactiveFormsModule, MatDatepickerModule,MatNativeDateModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatExpansionModule,
    AddressAutocompleteDirective],
})
export class FormComponent {
    private formBuilder = inject(FormBuilder);
    @Input() fields: FormFieldConfig[] = [];
    @Input() actionName: string | null = null;
    @Input() data: any= null;
    @Output() formSubmit = new EventEmitter<FormGroup>();
    @Output() formClear = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() addressSelected = new EventEmitter<{ fieldName: string, details: AddressDetails }>();
    formGroup: FormGroup = this.formBuilder.group({}); // Generic FormGroup

    ngOnInit(): void {
      this.initForm();
    }
  
    initForm(): void {
      const formControls: { [key: string]: any } = {};
      this.fields.forEach((field) => {
        formControls[field.name] = ['', field.validators];
      });
      this.formGroup = this.formBuilder.group(formControls);
      if (this.data) {
        this.formGroup.patchValue(this.data);
      }
    }

    handleAddressOutput(fieldName: string, details: AddressDetails): void {
        this.addressSelected.emit({ fieldName, details });
        
        // OPTIONAL: Directly patch the form control here for immediate UI update
        this.formGroup.patchValue({
            [fieldName]: details.fullAddress,
            // You can assume a 'zipCode' field exists and update it too
            zipCode: details.zipCode 
        });
    }

    onSubmit(): void {
        if (this.formGroup.valid) {
        this.formSubmit.emit(this.formGroup);
        }
    }

    clearForm(): void {
    this.formGroup.reset();
    this.formClear.emit();
    }

    cancelForm():void{
      this.cancel.emit();
    }
}