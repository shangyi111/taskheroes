import { Component, EventEmitter,Output, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Category {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'th-filter',
  standalone: true, 
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports:[MatFormFieldModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  animations: [
    trigger('fadeInSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
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
    { value: 'businessName', viewValue: 'Business Name' },
    { value: 'hourlyRate', viewValue: 'Hourly Rate' },
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
    this.submitFilters();
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

  // Helper to count active filters for the @if condition
getActiveFilterCount(): number {
  return this.getActiveChips().length;
}

// Logic to generate the chips based on current form state
getActiveChips() {
  const chips: any[] = [];
  const val = this.filterForm.value;

  // Add chip for keyword
  if (val.query) {
    chips.push({ id: 'q', key: 'query', label: `Keyword: ${val.query}` });
  }

  // Add chip for zipcode
  if (val.zipcode) {
    chips.push({ id: 'z', key: 'zipcode', label: `Zip: ${val.zipcode}` });
  }

  // Add chips for categories (since it's an array)
  if (val.category && val.category.length > 0) {
    val.category.forEach((cat: string) => {
      chips.push({ 
        id: `cat-${cat}`, 
        key: 'category', 
        value: cat, 
        label: cat.charAt(0).toUpperCase() + cat.slice(1) 
      });
    });
  }

  return chips;
}

// Logic to remove a filter when a chip is clicked
removeFilter(key: string, value?: any): void {
    if (key === 'category') {
      const currentCategories = this.filterForm.get('category')?.value as string[];
      const updated = currentCategories.filter(c => c !== value);
      this.filterForm.patchValue({ category: updated });
    } else {
      this.filterForm.get(key)?.reset();
    }
    
    // Re-submit automatically to refresh the list
    this.submitFilters(); 
  }
}