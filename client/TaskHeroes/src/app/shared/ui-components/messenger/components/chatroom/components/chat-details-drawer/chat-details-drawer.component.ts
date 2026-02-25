import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/shared/models/user';
import { Job, PriceItem } from 'src/app/shared/models/job';
import { Service } from 'src/app/shared/models/service';
import { JobStatus } from 'src/app/shared/models/job-status.enum';

declare var Quill: any;
@Component({
  selector: 'app-chat-details-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-details-drawer.component.html',
  styleUrls: ['./chat-details-drawer.component.scss']
})
export class ChatDetailsDrawerComponent {

  quill: any;
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
  isProcessingAction = signal(false);
  isSubmitting = signal(false);
  hourlyRate = signal(0);
  duration = signal(0);
  lineItems = signal<PriceItem[]>([]);
  showCalendarMenu = signal(false);
  partnerReputation = input<any | null>(null);
  chatroomId = input<string | null>(null);
 
  // Agreement State
  isEditingAgreement = signal(false);
  localTerms = ''; // Keep as string for simple textarea binding
  localLinks = signal<any[]>([]);
  tempLinkName = '';
  tempLinkUrl = '';

  // Outputs
  close = output<void>();
  jobUpdated = output<Job>();
  statusChange = output<{ status: JobStatus; reason?: string }>();

  state = computed(() => {
    const details = this.jobDetails();
    const user = this.currentUser(); // Pass this in or inject it
    if (!details || !user) return null;

    const isProvider = user.id === details.performerId;
    const isCustomer = user.id === details.customerId;
    const status = details.jobStatus!;
    const isMyTurn = details.lastActionBy !== user.id;

    const iHaveConfirmed = isProvider ? !!details.confirmedByProviderAt : !!details.confirmedBySeekerAt;
    const partnerHasConfirmed = isProvider ? !!details.confirmedBySeekerAt : !!details.confirmedByProviderAt;

    return {
      isProvider,
      isCustomer,
      // Phase 1: Provider Accept/Decline (PENDING state)
      canAcceptInquiry: isProvider && status === JobStatus.Pending,
      
      // Phase 2: Mutual Confirmation (ACCEPTED state)
      needsMyConfirmation: status === JobStatus.Accepted && !iHaveConfirmed,
      isWaitingForPartner: status === JobStatus.Accepted && iHaveConfirmed && !partnerHasConfirmed,
      
      // Phase 3: Booked (Finalized)
      isFullyBooked: status === JobStatus.Booked,
      // PRICE: Provider can adjust the quote during negotiation or before completion.
      canRequestChange: isProvider && [JobStatus.Pending, JobStatus.Accepted].includes(status) && !iHaveConfirmed
    };
  });

  addLink() {
    const url = this.tempLinkUrl.trim().toLowerCase();
    
    // 1. Basic Protocol Check
    if (!url.startsWith('https://')) {
      alert("For security, only secure 'https' links from trusted providers are allowed.");
      return;
    }

    // 2. Blacklisted Extensions Check (Prevent direct script/exe uploads)
    const maliciousExtensions = ['.exe', '.bat', '.js', '.sh', '.zip', '.rar'];
    if (maliciousExtensions.some(ext => url.endsWith(ext))) {
      alert("Direct links to executable or compressed files are not permitted.");
      return;
    }   
    const name = this.tempLinkName || 'Document';
    this.localLinks.update(links => [...links, { name, url: this.tempLinkUrl }]);
    this.tempLinkName = '';
    this.tempLinkUrl = '';
  }

  removeLink(index: number) {
      this.localLinks.update(links => links.filter((_, i) => i !== index));
  }

  saveAgreementWithQuill() {
        const currentJob = this.jobDetails();
        if (!currentJob || !this.quill) return;

        // Get the full HTML (including <strong> for bold)
        const updatedContent = this.quill.root.innerHTML;

        this.jobUpdated.emit({
            ...currentJob,
            providerTerms: updatedContent,
            documents: this.localLinks()
        });

        this.isEditingAgreement.set(false);
  }

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
          this.isProcessingAction.set(false);
          this.cancelEdit(); // Reset everything to a clean state
        }

        if (this.isEditingAgreement()) {
            // Wait for Angular to render the div before initializing Quill
            setTimeout(() => this.initializeQuill(), 0);
        } else {
            this.quill = null; // Cleanup
        }
    }, { allowSignalWrites: true });
  }

private initializeQuill() {
        const container = document.getElementById('quill-editor');
        if (!container) return;

        this.quill = new Quill('#quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic'],
                    [{ 'list': 'bullet' }],
                    ['clean'] // Removes formatting
                ]
            },
            placeholder: 'Enter your terms (e.g. 20% non-refundable deposit...)'
        });

        // Set initial content from current job details
        this.quill.root.innerHTML = this.jobDetails()?.providerTerms || '';
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
    this.isProcessingAction.set(true);
    this.statusChange.emit({ status: newStatus });
  }
  cancelEdit() {
    this.isEditingPrice.set(false);
    this.isEditingAgreement.set(false);
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

  openSeekerPortfolio() {
    const job = this.jobDetails();
    const roomId = this.chatroomId(); // Get the ID from the new input
    
    if (!job?.customerId || !roomId) return;

    // Generate the URL with the security token (chatroomId)
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        ['/seeker', job.customerId, 'portfolio'], 
        { queryParams: { chatroomId: roomId } } 
      )
    );
    
    window.open(url, '_blank');
  }
}