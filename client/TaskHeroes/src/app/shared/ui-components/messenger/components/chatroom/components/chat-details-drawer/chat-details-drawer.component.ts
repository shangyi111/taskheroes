import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/shared/models/user';
import { Job, PriceItem } from 'src/app/shared/models/job';
import { Service } from 'src/app/shared/models/service';
import { JobStatus } from 'src/app/shared/models/job-status.enum';

@Component({
  selector: 'app-chat-details-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-details-drawer.component.html',
  styleUrls: ['./chat-details-drawer.component.scss']
})
export class ChatDetailsDrawerComponent {

  public readonly JobStatus = JobStatus;
  private router= inject(Router);
  private closeTimer: any;
  // Inputs
  isOpen = input.required<boolean>();
  jobDetails = input.required<Job | null>();
  serviceDetails = input.required<Service | null>();
  currentUser = input.required<User | null>();

  // Local UI State
  isEditingPrice = signal(false);
  isSubmitting = signal(false);
  hourlyRate = signal(0);
  duration = signal(0);
  lineItems = signal<PriceItem[]>([]);
  showCalendarMenu = signal(false);

  // Outputs
  close = output<void>();
  jobUpdated = output<Job>();
  statusChange = output<JobStatus>();

  state = computed(() => {
    const details = this.jobDetails();
    const user = this.currentUser(); // Pass this in or inject it
    if (!details || !user) return null;

    const isProvider = user.id === details.performerId;
    const isCustomer = user.id === details.customerId;
    const status = details.jobStatus;
    const isMyTurn = details.lastActionBy !== user.id;

    return {
      isProvider,
      isCustomer,
      // Logic: Can edit if they are the provider and job isn't finished
      canRequestChange: isProvider && status && [JobStatus.Pending, JobStatus.Accepted].includes(status),
      // Seeker sees buttons only when job is Pending (awaiting their move)
      canActionJob: isCustomer && status === JobStatus.Pending && isMyTurn
    };
  });

  calculatedTotal = computed(() => {
    return this.lineItems().reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  });

  readonlyTotal = computed(() => {
    const details = this.jobDetails();
    if (!details?.priceBreakdown) return 0;
    return details.priceBreakdown.reduce((sum, item: any) => sum + (Number(item.amount) || 0), 0);
  });

  constructor() {
    // Every time the job changes, force the edit mode to close
    effect(() => {
        const currentJob = this.jobDetails();
        if (currentJob) {
        this.cancelEdit(); // Reset everything to a clean state
        }
    }, { allowSignalWrites: true });
  }

  openServiceExternal() {
    const service = this.serviceDetails();
    if (!service?.id) return;

    // Option A: Open in a new tab (Standard for "External" deep dives)
    const url = this.router.serializeUrl(
        this.router.createUrlTree(['/service', service.id])
    );
    window.open(url, '_blank');
  }

  openMenu() {
    clearTimeout(this.closeTimer);
    this.showCalendarMenu.set(true);
  }

    closeMenu() {
        // 200ms delay gives a "softer" feel and prevents accidental closing
        this.closeTimer = setTimeout(() => {
            this.showCalendarMenu.set(false);
        }, 200);
    }
  // Update the 'base' type item in the list when hours or rate change
  updateBaseItem() {
    const baseAmount = (this.hourlyRate() * this.duration()) / 60;
    this.lineItems.update(items => items.map(item => 
      item.type === 'base' ? { ...item, amount: baseAmount } : item
    ));
  }
  startEdit() {
    this.resetToDatabaseValues();
    this.isEditingPrice.set(true);
  }

  updateJobStatus(newStatus: JobStatus) {
    this.statusChange.emit(newStatus);
  }

  cancelEdit() {
    this.isEditingPrice.set(false);
    this.resetToDatabaseValues();
  }
  submitAdjustment() {
    const currentJob = this.jobDetails();
    if (!currentJob) return;
    this.isSubmitting.set(true);

    // Map UI state back to the Job interface structure
    const updatedJob: Job = {
      ...currentJob,
      hourlyRate: this.hourlyRate(),
      duration: this.duration(), // Convert hours back to minutes for DB
      priceBreakdown: this.lineItems(),
      jobStatus: JobStatus.Pending // Revert to Pending so Seeker must re-accept
    };

    this.jobUpdated.emit(updatedJob);
    this.isEditingPrice.set(false);
    this.isSubmitting.set(false);
  }

  handlePrice(approved: boolean) {
    console.log('Price adjustment handled. Approved:', approved);
    // TODO: Connect to JobService to Accept/Decline
  }

  addItem() {
    this.lineItems.update(items => [...items, {type: 'custom', label: '', amount: 0 }]);
  }

  removeItem(index: number) {
    this.lineItems.update(items => items.filter((_, i) => i !== index));
  }

  /**
   * Re-syncs local UI signals with the actual data from the jobDetails input.
   * This is the "Single Source of Truth" reset.
   */
  private resetToDatabaseValues() {
    const d = this.jobDetails();
    if (!d) {
      this.hourlyRate.set(0);
      this.duration.set(0);
      this.lineItems.set([]);
      return;
    }

    // 1. Reset core drivers
    this.hourlyRate.set(Number(d.hourlyRate) || 0);
    this.duration.set(Number(d.duration) || 0);
    
    // 2. Reset the itemized list (deep copy to avoid mutating inputs)
    const initialItems = (d.priceBreakdown || []).map(item => ({ ...item }));
    this.lineItems.set(initialItems);
  }

  /**
    * Combines a Date object and a time string (e.g., '09:00' or '2:30 PM') 
    * into a Google Calendar-friendly ISO string.
  */
  formatForCalendar(dateInput: Date | string, timeStr: string, durationMinutes: number = 60): { start: string, end: string } {
    const date = new Date(dateInput);
    
    // Handle 12h/24h conversion logic
    let [hours, minutes] = timeStr.split(/[:\s]/).map(val => parseInt(val, 10));
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const startDate = new Date(date.setHours(hours, minutes, 0));
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const toCalString = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return {
        start: toCalString(startDate),
        end: toCalString(endDate)
    };
  }

  generateCalendarLink() {
    const details = this.jobDetails();
    if (!details) return '';

    const { start, end } = this.formatForCalendar(
        details.jobDate!, 
        details.startTime!, 
        details.duration
    );

    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
        text: `TaskHeroes: ${details.jobTitle}`,
        dates: `${start}/${end}`,
        details: details.jobDescription || 'Service booked via TaskHeroes',
        location: details.location || '',
        sf: 'true',
        output: 'xml'
    });

    return `${baseUrl}&${params.toString()}`;
  }

  generateICalLink() {
    const details = this.jobDetails();
    if (!details || !details.jobDate || !details.startTime) {
        return '';
    }

    const { start, end } = this.formatForCalendar(details.jobDate, details.startTime, details.duration);
    
    // Format the .ics content
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:TaskHeroes: ${details.jobTitle}`,
        `DESCRIPTION:${details.jobDescription || 'Service booked via TaskHeroes'}`,
        `LOCATION:${details.location || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    // Create a Data URI so it downloads on click
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  }
}