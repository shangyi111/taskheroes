const JobStatus = require('./jobStatus');

const STATUS_RULES = {
  [JobStatus.ACCEPTED]: {
    from: [JobStatus.PENDING],
    actor: ['performerId','customerId'],
    errorMessage: "Provider can accept a pending job. Customer can accept a pending job that's been requested for changes."
  },
  [JobStatus.DEPOSIT_SENT]: {
    from: [JobStatus.ACCEPTED],
    actor: ['customerId'],
    errorMessage: "Only the seeker can mark deposit as sent."
  },
  [JobStatus.DEPOSIT_RECEIVED]: {
    from: [JobStatus.ACCEPTED, JobStatus.DEPOSIT_SENT],
    actor: ['performerId'],
    errorMessage: "Only the provider can confirm receipt."
  },
  [JobStatus.BOOKED]: {
    from: [JobStatus.ACCEPTED, JobStatus.DEPOSIT_RECEIVED],
    actor: ['performerId'],
    errorMessage: "Job must be accepted or deposit confirmed to book."
  },
  [JobStatus.VERIFIED]: {
    from: [JobStatus.COMPLETED],
    actor: ['customerId'],
    errorMessage: "Only the seeker can verify completion."
  }
};

module.exports = STATUS_RULES;