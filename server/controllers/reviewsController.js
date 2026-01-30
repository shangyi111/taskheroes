const { Review, Job, User } = require('../models');
const { Op } = require('sequelize');
const {
  sendReviewUpdated,
  sendReviewCreated,
  sendReviewDeleted,
} = require('../websocket/handlers/reviewHandler');
const NotificationService = require('../services/notificationService');
const { reviewEligibility } = require('../constants/reviewEligibility');


// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: {
        serviceId: serviceId,
        isPublished: true
      }
    });
    res.json(reviews);
  } catch (error) {
    console.log("error inside get all reviews",error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findByPk({
      where: {
        serviceId: req.params.id,
        isPublished: true // CRITICAL: Only show published reviews
      }
    });
    if (review) {
      res.json(review);
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    // 1. Fetch the job immediately (we need its updatedAt for the time check)
    const job = await Job.findByPk(jobId, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'email', 'username'] },
        { model: User, as: 'performer', attributes: ['id', 'email', 'username'] }
      ]
    });

    const eligibility = await exports.checkReviewEligibility(job, req.user.id);

    if (!eligibility.allowed) {
      return res.status(400).json({ message: `Cannot review: ${eligibility.reason}` });
    }

    // Determine roles
    let reviewerRole;
    let revieweeId;

    if (job.customerId === userId) {
      reviewerRole = 'seeker';
      revieweeId = job.performerId;
    } else if (job.performerId === userId) {
      reviewerRole = 'provider';
      revieweeId = job.customerId;
    } else {
      return res.status(403).json({ message: 'Unauthorized to review this job' });
    }

    let review = await Review.findOne({
      where: { jobId, reviewerId: userId }
    });

    if (review) {
      // UPDATE existing
      review = await review.update({
        ...req.body,
        reviewerRole // ensure role is consistent
      });
    } else {
      // 3. Create the review with role-specific data
      review = await Review.create({ 
        ...req.body, 
        reviewerId: userId,
        revieweeId,
        reviewerRole,
        serviceId: job.serviceId, // Automatically link from job
        addedDate: new Date()
      }); 
    }

    // 2. Check if the other party has already reviewed this job
    const otherReview = await Review.findOne({
      where: {
        jobId: jobId,
        reviewerId: { [Op.ne]: userId }
      }
    });

    if (otherReview) {
      // BOTH parties have reviewed! Reveal both.
      await Review.update({ isPublished: true }, { where: { jobId: jobId } });
      // Notify both parties that reviews are now public
      await NotificationService.sendReviewsRevealedNotification(jobId);
    } else {
      // Only one person reviewed. Keep it hidden.
      // Notify the other person(reviewee): "Your partner left a review! Leave yours to see it."
      await NotificationService.sendPromptToReview(jobId, revieweeId);
    }
    res.status(201).json(review);
    sendReviewCreated(review);
  } catch (error) {
    console.error("Error creating review:", error);
    const message = error.errors ? error.errors[0].message : error.message;
    res.status(400).json({ message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    // 1. Find the review and include the Job to check eligibility
    const review = await Review.findOne({
      where: { id: reviewId, reviewerId: userId },
      include: [{ model: Job, as: 'Job' }] // Ensure the alias matches your model
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    const eligibility = await exports.checkReviewEligibility(review.Job, userId);

    if (!eligibility.allowed) {
      return res.status(403).json({ 
        message: 'This review is no longer editable.',
        reason: eligibility.isExpired ? 'expired' : 'published'
      });
    }
    const [updatedRowCount] = await Review.update(req.body, {
      where: { id: reviewId, reviewerId: req.user.id }, // Ensure user owns the review
      returning: true, // To get the updated record
    });

    if (updatedRowCount > 0) {
      const updatedReview = await Review.findByPk(reviewId);
      res.status(200).json(updatedReview);
      sendReviewUpdated(updatedReview);
    } else {
      res.status(404).json({ message: 'Review not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review disabled right now becuase it should be onl performed by Shangyi Chen
// exports.deleteReview = async (req, res) => {
//   try {
//     const review = await Review.findByPk(req.params.id);
//     if (!review || review.reviewerId !== req.user.id) { // Ensure user owns the review
//       return res.status(404).json({ message: 'Review not found or unauthorized' });
//     }
//     const deletedRows = await Review.destroy({
//       where: { id: req.params.id },
//     });
//     if (deletedRows > 0) {
//       res.status(204).send();
//       sendReviewDeleted(review.id, review.userId);
//     } else {
//       res.status(404).json({ message: 'Review not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Get all reviews for a specific Service ID
exports.getReviewsByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // 1. Validate the input ID
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return res.status(400).json({ message: 'Invalid service ID provided.' });
    }

    // 2. Find all reviews matching the serviceId column
    const reviews = await Review.findAll({
      where: {
        serviceId: serviceId,
        isPublished:true
      },
      order: [['addedDate', 'DESC']], // Order by date (newest first)
    });

    // 3. Return the results
    if (reviews.length > 0) {
      res.json(reviews);
    } else {
      // Return an empty array and 200 status if no reviews are found
      res.json([]); 
    }
  } catch (error) {
    console.log("Error inside getReviewsByServiceId:", error);
    res.status(500).json({ message: 'Failed to retrieve reviews for the service.' });
  }
};

exports.checkReviewEligibility = async (job, userId) => {
  try {
    // 1. Basic Validation: If no job or userId, exit early
    if (!job || !userId) {
      return { allowed: false, reason: 'Job not found or userId missing', daysRemaining: 0 };
    }

    const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
    const scheduledTime = job.jobDate ? new Date(job.jobDate).getTime() : Date().now;
    const timePassed = Date.now() - scheduledTime;
    const isExpired = timePassed > tenDaysInMs;

    // 2. Parallel Database Checks: More efficient than sequential awaits
    const [existingReview, isPublished] = await Promise.all([
      Review.findOne({ where: { jobId: job.id, reviewerId: userId } }),
      Review.findOne({ where: { jobId: job.id, isPublished: true } })
    ]);

    const isCorrectStatus = ['completed', 'verified'].includes(job.jobStatus);

    return reviewEligibility({
      allowed: isCorrectStatus && !isExpired && !isPublished,
      isExpired,
      hasReviewed: !!existingReview,
      daysRemaining: Math.max(0, Math.ceil((tenDaysInMs - timePassed) / (1000 * 60 * 60 * 24)))
    });

  } catch (error) {
    // Log the error for internal tracking
    console.error("Error in checkReviewEligibility:", error);
    
    // Fail safe: Return 'allowed: false' so the UI doesn't break or show buttons incorrectly
    return reviewEligibility({
      allowed: false
    });
  }
};