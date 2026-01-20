import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef,NgZone} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { CalendarDataService } from 'src/app/services/calendar-data.service';
import { CalendarAvailability, ProviderCalendar } from 'src/app/shared/models/calendar';
import { Job } from 'src/app/shared/models/job';
import { User } from 'src/app/shared/models/user';
import { Service } from 'src/app/shared/models/service';

// Define constants outside the class for clarity
const TIME_FEE_THRESHOLD_MINUTES = 30; // 30 minutes one-way threshold
const FEE_PER_MINUTE_EXCEEDED = 1.00; // $1.00 per minute exceeded

@Component({
  selector: 'seeker-calendar',
  standalone: true,
  templateUrl: './seeker-calendar.component.html',
  styleUrls: ['./seeker-calendar.component.scss'],
  imports: [CommonModule, FormsModule, MatIconModule, CurrencyPipe, DatePipe], 
})
export class SeekerCalendarComponent implements OnInit, OnDestroy {
  currentMonth: Date = new Date();
  daysInMonth: any[] = [];
  
  // Input from host component (ServiceDetailsComponent)
  @Input() service!: Service;
  @Input() user!: User;

  // Data fetched from backend
  basePrice: number = 0;
  providerAvailability: { [key: string]: any } = {};
  availabilityWindowDays: number = 90;

  // Seeker's selected state
  selectedDateData: any = null;
  showTimeSlotModal: boolean = false; 
  
  // State for booking form inputs
  seekerJobLocation: string | null = null;
  selectedStartTime: string | null = '9:00 AM'; // Default start time
  selectedDurationHours: number = 2; 
  seekerJobDescription: string = '';
  
  // Calculation properties
  calculatedDrivingTimeMinutes: number = 0; 
  calculatedJobFee: number = 0;

  @ViewChild('addressInput') addressInput!: ElementRef;

  // New property for the Autocomplete instance
  private autocomplete: google.maps.places.Autocomplete | undefined;
  private calendarSubscription: Subscription | null = null;
  
  @Output() bookRequest = new EventEmitter<any>();

  constructor(private calendarDataService: CalendarDataService, private ngZone: NgZone) {}

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

    this.calendarSubscription = this.calendarDataService.getCalendarData(this.service.userId, this.service.id!, formattedMonth)
      .subscribe({
        next: (data: ProviderCalendar) => {
          this.basePrice = data.basePrice;
          this.providerAvailability = data.availability;
          this.availabilityWindowDays = data.availabilityWindow || 90;
          this.generateCalendar();
        },
        error: (err) => {
          console.error('Failed to fetch calendar data:', err);
        }
      });
  }

generateCalendar(): void {
    this.daysInMonth = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    // Define the default maximum bookable date
    const maxBookableDate = new Date(today.getTime());
    maxBookableDate.setDate(today.getDate() + this.availabilityWindowDays);
    
    // ... (rest of date and month setup) ...
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const numDays = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    const currentProviderAvailability = this.providerAvailability || {};

    // Add placeholders
    for (let i = 0; i < startDayOfWeek; i++) {
      this.daysInMonth.push({ date: null, isCurrentMonth: false, isBookable: false });
    }
    
    // Add actual days
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i);
      const isPast = date.getTime() < today.getTime();
      
      // Check if the date is OUTSIDE the Provider's DEFAULT window
      const isOutsideDefaultWindow = date.getTime() > maxBookableDate.getTime(); 
      const formattedDate = this.formatDate(date);
      
      const dayAvailability = currentProviderAvailability[formattedDate];
      
      let finalAvailability;

      // 1. Check for EXPLICIT BACKEND DATA (Overrides window check)
      if (dayAvailability && typeof dayAvailability === 'object' && dayAvailability.status) {
          finalAvailability = dayAvailability;
      } 
      // 2. Check the DEFAULT window boundary
      else if (isOutsideDefaultWindow) {
          // If there's NO explicit data AND it's outside the default window, it's unavailable
          finalAvailability = { isAvailable: false, status: 'unavailable', customPrice: null };
      } 
      // 3. Default to available (within the window AND no explicit data saying otherwise)
      else {
          finalAvailability = { isAvailable: true, status: 'available', customPrice: null };
      }

      // Day is bookable ONLY IF it's not past and has 'available' status
      const isBookable = !isPast && finalAvailability.status === 'available';

      this.daysInMonth.push({
        date: date,
        isCurrentMonth: true,
        isBookable: isBookable,
        isSelected: this.selectedDateData && this.selectedDateData.date.getTime() === date.getTime(),
        availability: finalAvailability
      });
    }
  }
  
  // Navigation
  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.selectedDateData = null; 
    this.fetchCalendarData(); 
  }
  
  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.selectedDateData = null; 
    this.fetchCalendarData(); 
  }

  private loadGoogleMapsScript(callback: () => void): void {
    // Check if the script is already loaded (i.e., 'google' object exists)
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      callback(); // Script is loaded, run the callback immediately
      return;
    }
    
    // Check if the script is already being added to avoid duplicates
    if (document.getElementById('google-maps-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Use the API key from your environment file here
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // Once the script loads, execute the callback (initAutocomplete)
    script.onload = () => {
      this.ngZone.run(() => {
        callback(); 
      });
    };
    
    document.head.appendChild(script);
  }
  initAutocomplete(): void {
    // Check if the Google Maps library is loaded and the element is available
    if (typeof google !== 'undefined' && this.addressInput && this.addressInput.nativeElement) {
      const inputElement = this.addressInput.nativeElement;
      
      this.autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ['address'], // Restrict predictions to physical addresses
        componentRestrictions: { 'country': ['us'] } // Optional: Restrict to US
      });

      // Listener for when a place (address) is selected from the dropdown
      this.autocomplete.addListener('place_changed', () => {
                this.ngZone.run(() => {
                    const place = this.autocomplete!.getPlace();
                    
                    // Update the ngModel (seekerJobLocation)
                    this.seekerJobLocation = place.formatted_address || place.name;
                    
                    // Trigger the fee calculation chain
                    this.handleTimeOrLocationChange(); 
                }); // <--- END NGZONE.RUN
            });
    }
  }
  // Seeker interaction
  selectDay(day: any): void {
    if (!day.isBookable) {
      this.selectedDateData = null;
      this.showTimeSlotModal = false;
      this.calculatedJobFee = 0;
      this.generateCalendar(); 
      return;
    }
    
    // Toggle selection: If the same day is clicked, deselect and close modal
    if (this.selectedDateData && this.selectedDateData.date.getTime() === day.date.getTime()) {
      this.selectedDateData = null;
      this.showTimeSlotModal = false;
      this.calculatedJobFee = 0;
    } else {
      // Set New Selection and open modal
      this.selectedDateData = day;
      this.showTimeSlotModal = true; 
      this.loadGoogleMapsScript(() => {
          // Since the address input is in the modal, ensure the modal is open 
          // before calling initAutocomplete
          if (this.showTimeSlotModal) {
            this.initAutocomplete();
          }
      });
      // Recalculate based on new date and current time/location inputs
      this.getDrivingTimeFromBackend(); 
    }
    
    this.generateCalendar(); // Update calendar highlighting
  }

  // Handles location or time/duration input changes and triggers fee calculation
  handleTimeOrLocationChange(): void {
    if (this.selectedDateData) {
      this.getDrivingTimeFromBackend();
    }
  }

  // Calls backend service to get travel time
  getDrivingTimeFromBackend(): void {
    if (!this.service.businessAddress || !this.seekerJobLocation || !this.selectedDateData) {
        this.calculatedDrivingTimeMinutes = 0;
        this.calculateFee();
        return;
    }

    this.calendarSubscription = this.calendarDataService.getDrivingTime(this.service.businessAddress, this.seekerJobLocation)
        .subscribe({
            next: (data) => {
                this.calculatedDrivingTimeMinutes = data.roundTripTimeMinutes; 
                this.calculateFee(); 
            },
            error: (err) => {
                console.error("Failed to get driving time.", err);
                this.calculatedDrivingTimeMinutes = 0; 
                this.calculateFee();
            }
        });
  }

  calculateFee(): void {
    const duration = this.selectedDurationHours || 0;
    const hourlyRate = this.selectedDateData?.availability?.customPrice || this.basePrice || 0;
    
    if (duration < 1 || !this.selectedDateData) {
        this.calculatedJobFee = 0;
        return;
    }

    // --- 1. Calculate Travel Fee (Round Trip) ---
    const totalDrivingTime = this.calculatedDrivingTimeMinutes; 
    
    const travelFee = this.calculatedTravelFees(totalDrivingTime);
    
    // --- 2. Calculate Labor Cost ---
    const laborCost = duration * parseFloat(hourlyRate);
    
    // --- 3. Set Final Fee ---
    this.calculatedJobFee = laborCost + travelFee!;
  }
  
  calculatedTravelFees(totalDrivingTime:number): number {
    const roundTripThreshold = TIME_FEE_THRESHOLD_MINUTES * 2; 
     if (totalDrivingTime > roundTripThreshold) {
        const exceededTime = totalDrivingTime - roundTripThreshold;
        return exceededTime * FEE_PER_MINUTE_EXCEEDED;
    } else return 0;
  }
  // Final action to emit booking request
  sendBookingRequestFromModal(): void {
    const isDescriptionMissing = !this.seekerJobDescription || this.seekerJobDescription.trim().length === 0;
    if (!this.selectedDateData || !this.selectedStartTime || this.selectedDurationHours < 1 
        || !this.seekerJobLocation || this.calculatedJobFee === 0 ||isDescriptionMissing) {
      alert("Please ensure all booking details are filled and the fee is calculated.");
      return;
    }

    const requestData :Job = {
      serviceId: this.service.id,
      performerId: this.service.userId,
      jobDate: this.selectedDateData.date,
      location: this.seekerJobLocation,
      fee: this.calculatedJobFee.toFixed(2),
      hourlyRate: Number(this.selectedDateData.availability.customPrice),
      category:this.service.category,
      jobTitle:this.service.businessName,
      customerId:this.user?.id,
      description:this.seekerJobDescription.trim(),
    };
    
    this.bookRequest.emit(requestData);

    // Close and reset state after successful request
    this.closeTimeSlotModal();
  }

  // Modal actions
  closeTimeSlotModal(): void {
    this.showTimeSlotModal = false;
    this.selectedDateData = null; // Clear date selection to hide modal
    this.calculatedJobFee = 0;
    this.generateCalendar();
  }
  
  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}