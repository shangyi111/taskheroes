import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { CalendarDataService } from 'src/app/services/calendar-data.service';
import { ProviderCalendar } from 'src/app/shared/models/calendar';

@Component({
  selector: 'provider-calendar',
  templateUrl: './provider_calendar.component.html',
  styleUrls: ['./provider_calendar.component.scss'],
  imports:[ CommonModule,
    FormsModule,MatIconModule],
})
export class ProviderCalendarComponent implements OnInit {
  currentMonth: Date = new Date();
  daysInMonth: any[] = [];
  
  // Drag & drop state
  isDragging = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedDates: any[] = [];
  
  // Modal state
  showModal = false;
  bulkPrice: number | null = null;
  bulkAvailability: boolean = true;

  showSettingsModal = false;
  availabilityWindow: number = 90; // Default to 90 days
  
  // Input for service data
  @Input() serviceId!: string;
  @Input() providerId!: string;
  @Input() basePrice!: number;
  
  providerAvailability: { [key: string]: any } = {};

  // Output for saving changes
  @Output() saveChanges = new EventEmitter<any>();


  private calendarSubscription: Subscription | null = null;

  constructor(private calendarDataService: CalendarDataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchCalendarData();
  }

   ngOnDestroy(): void {
    if (this.calendarSubscription) {
      this.calendarSubscription.unsubscribe();
    }
  }

  fetchCalendarData(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth() + 1;
    const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;

    this.calendarSubscription = this.calendarDataService.getCalendarData(this.providerId, this.serviceId,formattedMonth)
      .subscribe({
        next: (data: ProviderCalendar) => {
          this.basePrice = data.basePrice;
          this.providerAvailability = data.availability;
          this.availabilityWindow = data.availabilityWindow || 90;
          this.generateCalendar();
        },
        error: (err) => {
          console.error('Failed to fetch calendar data:', err);
          // Handle error (e.g., show an error message)
        }
      });
  }
  
  // Helper to generate the calendar days
  generateCalendar(): void {
    const newDaysInMonth: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const endDate = new Date(today.getTime());
    endDate.setDate(today.getDate() + this.availabilityWindow);
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const numDays = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    const currentProviderAvailability = this.providerAvailability || {};

    // Add empty placeholders for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      newDaysInMonth.push({ 
        date: null, 
        isCurrentMonth: false ,
        isPast: true,
        isFutureBlocked: true,
        availability: { isAvailable: false, customPrice: null }
      });
    }
    
    // Add all the days of the month
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i);
      const isPast = date.getTime() < today.getTime();
      const isFutureBlocked = date.getTime() > endDate.getTime();
      const formattedDate = this.formatDate(date);
      const isSelected = this.selectedDates.some(d => d.getTime() === date.getTime());
      const dayAvailability = currentProviderAvailability[formattedDate];
      const finalAvailability = (dayAvailability && typeof dayAvailability === 'object')
      ? dayAvailability
      : { isAvailable: !isFutureBlocked, status: isFutureBlocked ? 'unavailable' : 'available',customPrice: null };
      newDaysInMonth.push({
        date: date,
        isCurrentMonth: true,
        isPast: isPast,
        isSelected: isSelected,
        isFutureBlocked: isFutureBlocked,
        availability: finalAvailability,
      });
    }

    this.daysInMonth = newDaysInMonth; 
    
    this.cdr.detectChanges();
  }

  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    if (this.availabilityWindow < 1) {
      console.error("Availability window must be a positive number.");
      return;
    }

    this.calendarDataService.updateAvailabilityWindow(this.serviceId, this.availabilityWindow)
      .subscribe({
        next: (response) => {
          console.log('Availability Window updated in backend:', response);
          // After a successful save, close the modal and re-fetch ALL calendar data
          this.closeSettingsModal();
          this.fetchCalendarData(); 
        },
        error: (err) => {
          console.error('Failed to save availability window:', err);
          // Handle error (e.g., show error message)
        }
      });
  }

  // Helper to format date for key lookup
  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
  
  // Navigation
  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.fetchCalendarData();
  }
  
  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.fetchCalendarData();
  }
  
  // Drag & drop logic
  startDrag(day: any): void {
    if (!day.isCurrentMonth || day.isPast || day.availability.status === 'booked') return;
    this.isDragging = true;
    this.startDate = day.date;
    this.endDate = day.date;
    this.highlightDates();
  }
  
  onDrag(day: any): void {
    if (!this.isDragging || !day.isCurrentMonth || day.isPast || day.availability.status === 'booked') return;
    this.endDate = day.date;
    this.highlightDates();
  }
  
  endDrag(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.selectedDates = this.selectedDates.filter(date => {
        const day = this.daysInMonth.find(d => d.date?.getTime() === date.getTime());
        return day && day.isCurrentMonth && !day.isPast && day.availability.status !== 'booked';
    });

    if (this.selectedDates.length > 0) {
        this.showModal = true;
    } else {
        // If no valid dates are selected, clear the selection
        this.selectedDates = [];
        this.generateCalendar();
    }
    }
  }
  
  highlightDates(): void {
    if (!this.startDate) return;
    const start = this.startDate.getTime();
    const end = this.endDate ? this.endDate.getTime() : start;
    const minTime = Math.min(start, end);
    const maxTime = Math.max(start, end);
    
    this.selectedDates = this.daysInMonth
      .filter(day => day.date && day.isCurrentMonth)
      .filter(day => {
        const time = day.date.getTime();
        return time >= minTime && time <= maxTime;
      })
      .map(day => day.date);
      
    this.daysInMonth.forEach(day => {
      if (day.isCurrentMonth) {
        day.isSelected = this.selectedDates.some(d => d.getTime() === day.date.getTime());
      }
    });
  }
  
  // Modal actions
  closeModal(): void {
    this.showModal = false;
    this.bulkPrice = null;
    this.bulkAvailability = true;
    this.selectedDates = [];
    this.generateCalendar(); // Re-render to clear selection
  }
  
  saveBulkChanges(): void {
    const changes = {
      dates: this.selectedDates.map(d => this.formatDate(d)),
      price: this.bulkAvailability ? this.bulkPrice : null,
      availability: this.bulkAvailability
    };
    
    this.calendarDataService.saveCalendarChanges(this.providerId, this.serviceId, changes)
      .subscribe({
        next: (response) => {
          console.log('Changes saved successfully:', response);
          this.fetchCalendarData(); 
        },
        error: (err) => {
          console.error('Failed to save changes:', err);
          // Handle error
        }
      });

    this.closeModal();
  }

  onClick(day: any): void {
    if (day.availability.status === 'booked' && day.availability.bookingInfo) {
     //todo to redirect to job order page or messenger page
    }
  }
}