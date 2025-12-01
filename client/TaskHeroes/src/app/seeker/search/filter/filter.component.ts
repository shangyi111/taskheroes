import { Component, EventEmitter,Output, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Category {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'th-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports:[MatFormFieldModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
})
export class FilterComponent {
  private fb = inject(FormBuilder);
  showAdvanced: boolean = false;
  filterForm: FormGroup = this.fb.group({
    category: [[]], // Use an array for multi-select categories
    zipcode: [''],
    radius: [null],
    query: [''], 
    minHourlyRate: [null],
    maxHourlyRate: [null],
    sortBy: [''],
    sortOrder: ['asc'], // Default sort order
    // Add more filter controls here as needed
  });

  categories: Category[] = [
    { value: 'plumbing', viewValue: 'Plumbing' },
    { value: 'electrical', viewValue: 'Electrical' },
    { value: 'cleaning', viewValue: 'Cleaning' },
    { value: 'handyman', viewValue: 'Handyman Services' },
    // Add more categories as needed
  ];
  radiusOptions: number[] = [5, 10, 25, 50, 100];
  sortOptions: { value: string; viewValue: string }[] = [
    { value: 'jobTitle', viewValue: 'Job Title' },
    { value: 'hourlyRate', viewValue: 'Hourly Rate' },
    { value: 'createdAt', viewValue: 'Date Posted' },
    // Add more sorting options
  ];
  sortOrderOptions: { value: string; viewValue: string }[] = [
    { value: 'asc', viewValue: 'Ascending' },
    { value: 'desc', viewValue: 'Descending' },
  ];


  @Output() filtersChanged = new EventEmitter<any>();

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  resetFilters(): void {
    this.filterForm.reset({ category: [], zipcode: '', radius: null, query: '', minHourlyRate: null, maxHourlyRate: null, sortBy: '', sortOrder: 'asc' });
  }
  formatFilters(formValue: any): any {
    const filters: any = {};
    if (formValue.category && formValue.category.length > 0) {
      filters.category = formValue.category; // Send as an array
    }
    if (formValue.zipcode) {
      filters.zipcode = formValue.zipcode;
    }
    if (formValue.radius) {
      filters.radius = formValue.radius;
    }
    if (formValue.query) {
      filters.keyword = formValue.query; // Backend expects 'keyword'
    }
    if (formValue.minHourlyRate !== null) {
      filters.minHourlyRate = formValue.minHourlyRate;
    }
    if (formValue.maxHourlyRate !== null) {
      filters.maxHourlyRate = formValue.maxHourlyRate;
    }
    if (formValue.sortBy) {
      filters.sortBy = formValue.sortBy;
      filters.sortOrder = formValue.sortOrder;
    }
    return filters;
  }

  submitFilters(): void {
    this.filtersChanged.emit(this.formatFilters(this.filterForm.value));
  }
}