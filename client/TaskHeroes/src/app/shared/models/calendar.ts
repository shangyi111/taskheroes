export interface CalendarAvailability {
  isAvailable: boolean;
  customPrice: number | null;
  status?: 'booked' | 'unavailable' | 'available';
  jobId?: number;
}

export interface ExternalConflict {
  status: 'conflict';
  businessName: string;
  clientName: string;
  jobId: number | string;
}
export interface ProviderCalendar {
  basePrice: number;
  availability: { [date: string]: CalendarAvailability };
  externalConflicts?: { [date: string]: ExternalConflict };
  availabilityWindow: number;
}