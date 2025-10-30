const authMiddleware = require('../auth/authMiddleware'); 
const User = require('../models'); 

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        // CRUCIAL: Return a SANITIZED profile with only public fields
        res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            profilePicture: user.profilePicture // Needed for the messenger component
            // Do NOT include password hash, email (unless public), or sensitive tokens
        });
    } catch (error) {
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