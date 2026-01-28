export enum JobStatus {
  Pending = 'pending',                   // Initial request
  Accepted = 'accepted',                 // Provider agrees to the job
  DepositSent = 'depositSent',           // Seeker marks as paid
  DepositReceived = 'depositReceived',   // Provider confirms funds
  Booked = 'booked',                     // Official calendar lock
  InProgress = 'inProgress',             // Auto-triggered by system time
  Completed = 'completed',               // Auto-triggered by system time
  Verified = 'verified',                 // Seeker confirms satisfaction
  Cancelled = 'cancelled'                // Exit state
}