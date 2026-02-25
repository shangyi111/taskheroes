export enum JobStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Booked = 'booked',
  InProgress = 'inProgress',
  Completed = 'completed',
  Expired = 'expired',
  CancelledBySeeker = 'cancelledBySeeker',
  CancelledByProvider = 'cancelledByProvider'
}