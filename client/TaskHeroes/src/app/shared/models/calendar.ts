export interface CalendarAvailability {
  isAvailable: boolean;
  customPrice: number | null;
  status?: 'booked' | 'unavailable' | 'available';
  jobId?: number;
}

export interface ProviderCalendar {
  basePrice: number;
  availability: { [date: string]: CalendarAvailability };
  availabilityWindow: number;
}