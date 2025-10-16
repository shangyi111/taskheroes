export interface CalendarAvailability {
  isAvailable: boolean;
  customPrice: number | null;
  status?: 'booked' | 'unavailable' | 'available';
  bookingInfo?: string; 
}

export interface ProviderCalendar {
  basePrice: number;
  availability: { [date: string]: CalendarAvailability };
}