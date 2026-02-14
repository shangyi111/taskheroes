const authMiddleware = require('../auth/authMiddleware'); 
const User = require('../models/user'); 
const { Op } = require('sequelize');

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // CRUCIAL: Return a SANITIZED profile with only public fields
        res.status(200).json({
            id: user.id,
            username: user.username,
            profilePicture: user.profilePicture // Needed for the messenger component
            // Do NOT include password hash, email (unless public), or sensitive tokens
        });
    } catch (error) {
        console.error("FULL ERROR LOG:", error);
        res.status(500).json({ error: 'Server error retrieving user profile.' });
    }
};

// 3. PUT/PATCH /api/v1/users/me: Update the authenticated user's profile
exports.updateMe = [authMiddleware, async (req, res) => {
    try {
        // Filter req.body to prevent unauthorized updates (like changing role or ID)
        const allowedUpdates = { 
            username: req.body.username,
            profilePicture: req.body.profilePicture,
            // ... other safe fields
        };

        const updatedUser = await User.findByIdAndUpdate(req.user.id, allowedUpdates, { 
            new: true, runValidators: true 
        });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found for update.' });
        }

        res.status(200).json(updatedUser);

    } catch (error) {
    console.log("error inside get all services",error);
    res.status(400).json({ message: error.message });
  }
}];

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
            attributes: ['id', 'username', 'profilePicture']
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("BATCH USER ERROR:", error);
        res.status(500).json({ error: 'Server error retrieving batch user profiles.' });
    }
};