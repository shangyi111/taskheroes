const authMiddleware = require('../auth/authMiddleware'); 
const User = require('../models/user'); 
const UserProfile = require('../models/userProfile');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id,{
            include: [{ model: UserProfile }]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({
            id: user.id,
            email: user.email,
            username: user.username,
            profilePicture: user.profilePicture,
            isIdentityVerified:user.isIdentityVerified,
            stripeVerificationStatus:user.stripeVerificationStatus,
            stripeVerificationSessionId:user.stripeVerificationSessionId,
            profile: user.UserProfile || {}
            // Do NOT include password hash, email (unless public), or sensitive tokens
        });
    } catch (error) {
        console.error("FULL ERROR LOG:", error);
        res.status(500).json({ error: 'Server error retrieving user profile.' });
    }
};

// 3. PUT/PATCH /api/v1/users/me: Update the authenticated user's profile
exports.updateMe = async (req, res) => {
    try {
        // Filter req.body to prevent unauthorized updates (like changing role or ID)
        const userId = req.user.id;
        const { username, email, firstName, lastName, phone, profilePicture } = req.body;

        // 1. Update the core User table
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found for update.' });
        }
        
        if (profilePicture) user.profilePicture = profilePicture;
        if (username) user.username = username;
        if (email) user.email = email;
        await user.save(); // Save Sequelize instance

        // 2. Update or Create the UserProfile table
        const [profile] = await UserProfile.findOrCreate({ 
            where: { UserId: userId } 
        });
        
        if (firstName) profile.legalFirstName = firstName;
        if (lastName) profile.legalLastName = lastName;
        if (phone) profile.phoneNumber = phone;
        await profile.save();

        res.status(200).json({ message: 'Profile updated successfully', 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            },
            profile: {
                firstName: profile.legalFirstName,
                lastName: profile.legalLastName,
                phone: profile.phoneNumber
            }
        });

    } catch (error) {
    console.log("error inside get all services",error);
    res.status(400).json({ message: error.message });
  }
};

exports.getUsersBatch = async (req, res) => {
    try {
        const { ids } = req.body; // Expecting { "ids": [1, 2, 3] }

        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'An array of IDs is required.' });
        }

        // Fetch all users whose ID is in the provided list
        const users = await User.findAll({
            where: {
                id: { [Op.in]: ids }
            },
            // Always sanitize: only return public info
            attributes: [
                'id', 
                'username', 
                'profilePicture', 
                'isIdentityVerified', 
                'stripeVerificationStatus'
            ]
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("BATCH USER ERROR:", error);
        res.status(500).json({ error: 'Server error retrieving batch user profiles.' });
    }
};

exports.getPublicUserBatch = async (req, res) => {
  const { ids } = req.body;
  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'username', 'profilePicture'] // ONLY public fields
  });
  res.json(users);
};

// PUT/PATCH /api/v1/users/me/security: Update password and login email
exports.updateSecurity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, currentPassword, newPassword } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 1. Handle Email Update (if they typed a new one)
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ where: { email, id: { [Op.ne]: userId } }});
            if (existingEmail) {
                return res.status(400).json({ message: 'This email is already in use.' });
            }
            user.email = email;
        }

        // 2. Handle Password Update (if they typed a new one)
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'You must provide your current password to set a new one.' });
            }

            // Verify the current password matches what is in the DB
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }

            // Hash the new password before saving
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.status(200).json({ message: 'Security settings updated successfully.' });

    } catch (error) {
        console.error("Security update error:", error);
        res.status(500).json({ message: 'Server error updating security settings.' });
    }
};