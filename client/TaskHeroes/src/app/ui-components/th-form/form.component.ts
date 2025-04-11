import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { Provider } from 'src/app/shared/models/provider';

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
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatExpansionModule],
})
export class FormComponent {
    private formBuilder = inject(FormBuilder);
    @Input() fields: FormFieldConfig[] = [];
    @Input() actionName: string | null = null;
    @Input() data: any= null;
    @Output() formSubmit = new EventEmitter<FormGroup>();
    @Output() formClear = new EventEmitter<void>();
    formGroup: FormGroup = this.formBuilder.group({}); // Generic FormGroup

    ngOnInit(): void {
      this.initForm();
    }
  
    initForm(): void {
      const formControls: { [key: string]: any } = {};
      this.fields.forEach((field) => {
        formControls[field.name] = ['', field.validators];
      });
      this.formGroup = this.formBuilder.group(formControls); // Use formGroup
    }

    onSubmit(): void {
        if (this.formGroup.valid) { // Use formGroup
        this.formSubmit.emit(this.formGroup);
        }
    }

    clearForm(): void {
    this.formGroup.reset(); // Use formGroup
    this.formClear.emit();
    }
}