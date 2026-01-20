const { Job, Chatroom } = require('../models');
const {
  sendJobUpdated,
  sendJobCreated,
  sendJobDeleted,
} = require('../websocket/handlers/jobHandler');
const { Op } = require('sequelize');
const {
  sendChatroomCreated,
} = require('../message-server/realtime/notification-handler');

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
    console.log("req,res", req.params)
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
    // 2. Strict Check: Same customer, Same provider, Same service, Same day
    const existingJob = await Job.findOne({
      where: {
        customerId: req.body.customerId,
        performerId: req.body.performerId,
        serviceId: req.body.serviceId,
        jobStatus: {
          [Op.not]: 'cancelled' // Allow a new request if the old one was cancelled
        },
        jobDate: req.body.jobDate,
      }
    });

    if (existingJob) {
      return res.status(400).json({ 
        message: `You already have a ${existingJob.jobStatus} request for this service on ${existingJob.jobDate}.` 
      });
    }

    // 2. Create the Job (defaultValue 'pending' handles the status)
    const newJob = await Job.create({ ...req.body });
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
      const updatedJob = await Job.findByPk(jobId);
      res.status(200).json(updatedJob);
      sendJobUpdated(updatedJob);
    } else {
      res.status(404).json({ message: 'Job not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

