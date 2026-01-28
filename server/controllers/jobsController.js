const { Job, Chatroom, User } = require('../models');
const JobStatus = require('../constants/jobStatus');
const {
  sendJobUpdated,
  sendJobCreated,
  sendJobDeleted,
} = require('../websocket/handlers/jobHandler');
const { Op } = require('sequelize');
const {
  sendChatroomCreated,
} = require('../message-server/realtime/notification-handler');
const NotificationService = require('../services/notificationService');
const STATUS_RULES = require('../constants/jobStatusRules');

exports.getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findByPk(jobId);
    
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    console.error("Error retrieving job by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json(jobs);
  } catch (error) {
    console.log("error inside get all jobs",error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific job by ID
exports.getJobsByPerformerId = async (req, res) => {
  try {
    const job = await Job.findAll({where:
                                    {performerId:req.params.id}
                                  });
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get a specific job by customer ID
exports.getJobsByCustomerId = async (req, res) => {
  try {
    const job = await Job.findAll({where:
                                    {customerId:req.params.id}
                                  });
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Order(s) not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const startOfDay = new Date(req.body.jobDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(req.body.jobDate);
    endOfDay.setHours(23, 59, 59, 999);
    // 2. Strict Check: Same customer, Same provider, Same service, Same day
    const existingJob = await Job.findOne({
      where: {
        customerId: req.body.customerId,
        performerId: req.body.performerId,
        serviceId: req.body.serviceId,
        jobStatus: {
          [Op.not]: 'cancelled' // Allow a new request if the old one was cancelled
        },
        jobDate: {
          [Op.between]: [startOfDay, endOfDay] // Check the whole day
        }
      }
    });

    if (existingJob) {
      return res.status(400).json({ 
        message: `You already have a ${existingJob.jobStatus} request for this service on ${existingJob.jobDate}.` 
      });
    }

    // 2. Create the Job (defaultValue 'pending' handles the status)
    const newJob = await Job.create({ ...req.body });

    // Fetch the Provider's email to notify them
    const provider = await User.findByPk(req.body.performerId);
    if (provider && provider.email) {
      // Send notification to the provider
      await NotificationService.sendJobNotification(
        provider.email, 
        newJob.jobTitle || 'New Service Request', 
        'provider',
        newJob.id
      );
    }

    // 3. Create a NEW Chatroom for this specific Job
    const chatroom = await Chatroom.create({
      jobId: newJob.id,
      customerId: req.body.customerId,
      providerId: req.body.performerId,
      name: `Chat for ${newJob.jobTitle || 'New Job'}` // Optional: give it a name
    });

    // 4. Return the consolidated response
    res.status(201).json({ 
      job: newJob, 
      chatroomId: chatroom.id 
    });

    // 5. Trigger your real-time socket notification
    sendJobCreated(newJob);
    sendChatroomCreated(chatroom); 

  } catch (error) {
    console.error('Create Job Error:', error);
    // Safety check for Sequelize error structure
    const message = error.errors ? error.errors[0].message : 'Could not process request';
    res.status(400).json({ message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const [updatedRowCount] = await Job.update(req.body, {
      where: { id: jobId, performerId: req.user.id }, // Ensure user owns the job
      returning: true, // To get the updated record
    });

    if (updatedRowCount > 0) {
      const updatedJob = await Job.findByPk(jobId, {
        include: [{ model: User, as: 'customer', attributes: ['email'] }]
      });
      res.status(200).json(updatedJob);
      sendJobUpdated(updatedJob);

      // If the status was updated, send the email
      if (jobStatus && updatedJob.Customer) {
        await NotificationService.sendStatusUpdate(
          updatedJob.Customer.email,
          updatedJob.jobTitle,
          jobStatus,
          jobId
        );
      }
    } else {
      res.status(404).json({ message: 'Job not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateJobStatus = async (req, res) => {
  try {
    const { newStatus } = req.body;
    const userId = req.user.id;
    const job = await Job.findByPk(req.params.id,{
        include: [
                  {
                    model: User,
                    as: 'customer', // or 'Customer' depending on your association
                    attributes: ['id', 'username', 'email'] // ONLY public info
                  },
                  {
                    model: User,
                    as: 'performer',
                    attributes: ['id', 'username','email']
                  }
                ]
    });

    if (!job) return res.status(404).json({ message: 'Job not found' });
    // 1. Handle Cancellation (Wildcard) separately if needed
    if (newStatus === JobStatus.CANCELLED) {
      if ([JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.IN_PROGRESS].includes(job.jobStatus)) {
        return res.status(400).json({ message: "Cannot cancel now." });
      }
      return await finalizeStatusUpdate(job, newStatus, userId, res);
    }
    
    if([JobStatus.IN_PROGRESS, JobStatus.COMPLETED].includes(newStatus)){
      return res.status(400).json({ message: "Time-based transitions are handled automatically." });
    }

    // 2. Validate using the Rules Map
    const rule = STATUS_RULES[newStatus]; 

    if (!rule) {
      return res.status(400).json({ message: "Invalid status or system-protected transition." });
    }

    if (!rule.from.includes(job.jobStatus) || job[rule.actor] !== userId) {
      return res.status(403).json({ message: rule.errorMessage });
    }

    // 3. Success - Update database and trigger notifications
    return await finalizeStatusUpdate(job, newStatus, userId, res);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal helper to handle the "Side Effects" of a status change
const finalizeStatusUpdate = async (job, newStatus, userId, res) => {
  // 1. Update and Save
  job.jobStatus = newStatus;
  await job.save({ fields: ['jobStatus'] });
  // 2. Real-time Update (Socket)
  sendJobUpdated(job);

  // 3. Email Notification (Resend)
  // Logic: Notify the person who DIDN'T make the change
  // We use the loaded includes from the controller
  const recipient = userId === job.performerId ? job.customer : job.performer;

  if (recipient && recipient.email) {
    await NotificationService.sendStatusUpdate(
      recipient.email,
      job.jobTitle,
      newStatus,
      job.id
    );
  }

  return res.status(200).json(job);
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job || job.performerId !== req.user.id) { // Ensure user owns the job
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }
    const deletedRows = await Job.destroy({
      where: { id: req.params.id },
    });
    if (deletedRows > 0) {
      res.status(204).send();
      sendJobDeleted(job.id, job.userId);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete order
exports.deleteOrderByCustomerId = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job || job.customerId !== req.user.id) { // Ensure user owns the order
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }
    const deletedRows = await Job.destroy({
      where: { id: req.params.id },
    });
    if (deletedRows > 0) {
      res.status(204).send();
      sendJobDeleted(job.id, job.customerId);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete job
exports.deleteOrderByPerformerId = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job || job.performerId !== req.user.id) { // Ensure user owns the order
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }
    const deletedRows = await Job.destroy({
      where: { id: req.params.id },
    });
    if (deletedRows > 0) {
      res.status(204).send();
      sendJobDeleted(job.id, job.performerId);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

